import crypto from "node:crypto";
import http from "node:http";
import { URL } from "node:url";
import mysql from "mysql2/promise";

const PORT = Number(process.env.VIAS_API_PORT ?? 3001);
const SESSION_COOKIE = "vias_session";
const SESSION_DAYS = 7;

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME ?? "campus_access_now",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

function send(res, status, data, headers = {}) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    ...headers,
  });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  send(res, status, { error: message });
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Invalid JSON body");
    error.status = 400;
    throw error;
  }
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const eq = part.indexOf("=");
        return eq === -1
          ? [decodeURIComponent(part), ""]
          : [decodeURIComponent(part.slice(0, eq)), decodeURIComponent(part.slice(eq + 1))];
      }),
  );
}

function cookieHeader(token, maxAge) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function toIso(value) {
  if (!value) return value;
  return new Date(value).toISOString();
}

function toMysqlDateTime(value = new Date()) {
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}

function fromUser(row) {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    fullName: row.full_name,
    role: row.role,
    createdAt: toIso(row.created_at),
  };
}

function fromVehicle(row) {
  return {
    plateNumber: row.plate_number,
    ownerName: row.owner_name,
    matricOrStaffId: row.matric_or_staff_id,
    department: row.department,
    phone: row.phone,
    vehicleType: row.vehicle_type,
    vehicleColor: row.vehicle_color,
    category: row.category,
    imageDataUrl: row.image_data_url ?? undefined,
    registrationDate: toIso(row.registration_date),
    validUntil: toIso(row.valid_until),
    status: row.status,
  };
}

function fromLog(row) {
  return {
    id: row.id,
    plateNumber: row.plate_number,
    type: row.type,
    timestamp: toIso(row.timestamp),
    officerUsername: row.officer_username,
    result: row.result,
    reason: row.reason ?? undefined,
  };
}

function sessionFromUser(user) {
  return {
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
  };
}

async function getSession(req) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;

  const [rows] = await pool.execute(
    `SELECT u.*
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = :token AND s.expires_at > NOW()
     LIMIT 1`,
    { token },
  );

  return rows[0] ? sessionFromUser(fromUser(rows[0])) : null;
}

async function requireSession(req, res) {
  const session = await getSession(req);
  if (!session) {
    sendError(res, 401, "You must be signed in");
    return null;
  }
  return session;
}

async function requireAdmin(req, res) {
  const session = await requireSession(req, res);
  if (!session) return null;
  if (session.role !== "admin") {
    sendError(res, 403, "Admin access required");
    return null;
  }
  return session;
}

async function route(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method ?? "GET";

  if (method === "GET" && path === "/api/health") {
    await pool.query("SELECT 1");
    return send(res, 200, { ok: true });
  }

  if (method === "POST" && path === "/api/login") {
    const body = await readJson(req);
    const [rows] = await pool.execute(
      "SELECT * FROM users WHERE LOWER(username) = LOWER(:username) AND password = :password LIMIT 1",
      { username: String(body.username ?? "").trim(), password: String(body.password ?? "") },
    );
    if (!rows[0]) return sendError(res, 401, "Invalid username or password");

    const user = fromUser(rows[0]);
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
    await pool.execute(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (:token, :userId, :expiresAt)",
      { token, userId: user.id, expiresAt },
    );
    return send(res, 200, sessionFromUser(user), {
      "set-cookie": cookieHeader(token, SESSION_DAYS * 86400),
    });
  }

  if (method === "POST" && path === "/api/logout") {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) await pool.execute("DELETE FROM sessions WHERE token = :token", { token });
    return send(res, 200, { ok: true }, { "set-cookie": cookieHeader("", 0) });
  }

  if (method === "GET" && path === "/api/session") {
    return send(res, 200, await getSession(req));
  }

  if (method === "GET" && path === "/api/users") {
    if (!(await requireAdmin(req, res))) return;
    const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return send(res, 200, rows.map(fromUser));
  }

  if (method === "POST" && path === "/api/users") {
    if (!(await requireAdmin(req, res))) return;
    const body = await readJson(req);
    const user = {
      id: crypto.randomUUID(),
      username: String(body.username ?? "").trim(),
      password: String(body.password ?? ""),
      fullName: String(body.fullName ?? "").trim(),
      role: body.role === "admin" ? "admin" : "officer",
      createdAt: toMysqlDateTime(),
    };
    if (!user.username || !user.password || !user.fullName) {
      return sendError(res, 400, "Username, full name, and password are required");
    }
    try {
      await pool.execute(
        "INSERT INTO users (id, username, password, full_name, role, created_at) VALUES (:id, :username, :password, :fullName, :role, :createdAt)",
        user,
      );
    } catch (error) {
      if (error?.code === "ER_DUP_ENTRY") return sendError(res, 409, "Username already exists");
      throw error;
    }
    return send(res, 201, user);
  }

  const userDelete = path.match(/^\/api\/users\/([^/]+)$/);
  if (method === "DELETE" && userDelete) {
    if (!(await requireAdmin(req, res))) return;
    await pool.execute("DELETE FROM users WHERE id = :id AND username <> 'admin'", {
      id: userDelete[1],
    });
    return send(res, 200, { ok: true });
  }

  if (method === "GET" && path === "/api/vehicles") {
    if (!(await requireSession(req, res))) return;
    const [rows] = await pool.query("SELECT * FROM vehicles ORDER BY plate_number");
    return send(res, 200, rows.map(fromVehicle));
  }

  const vehiclePath = path.match(/^\/api\/vehicles\/([^/]+)$/);
  if (method === "GET" && vehiclePath) {
    if (!(await requireSession(req, res))) return;
    const [rows] = await pool.execute(
      "SELECT * FROM vehicles WHERE UPPER(plate_number) = UPPER(:plate) LIMIT 1",
      {
        plate: decodeURIComponent(vehiclePath[1]),
      },
    );
    return send(res, 200, rows[0] ? fromVehicle(rows[0]) : null);
  }

  if ((method === "POST" || method === "PUT") && (path === "/api/vehicles" || vehiclePath)) {
    if (!(await requireAdmin(req, res))) return;
    const body = await readJson(req);
    const originalPlate = vehiclePath
      ? decodeURIComponent(vehiclePath[1]).toUpperCase()
      : undefined;
    const vehicle = {
      plateNumber: String(body.plateNumber ?? "")
        .trim()
        .toUpperCase(),
      ownerName: String(body.ownerName ?? "").trim(),
      matricOrStaffId: String(body.matricOrStaffId ?? "").trim(),
      department: String(body.department ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      vehicleType: String(body.vehicleType ?? "").trim(),
      vehicleColor: String(body.vehicleColor ?? "").trim(),
      category: body.category,
      imageDataUrl: body.imageDataUrl ?? null,
      registrationDate: new Date(body.registrationDate),
      validUntil: new Date(body.validUntil),
      status: body.status ?? "Authorized",
    };
    if (
      !vehicle.plateNumber ||
      !vehicle.ownerName ||
      !vehicle.matricOrStaffId ||
      !vehicle.vehicleType ||
      !vehicle.vehicleColor
    ) {
      return sendError(res, 400, "Plate, owner, ID, vehicle type, and color are required");
    }

    if (originalPlate) {
      await pool.execute(
        `UPDATE vehicles SET
          plate_number = :plateNumber,
          owner_name = :ownerName,
          matric_or_staff_id = :matricOrStaffId,
          department = :department,
          phone = :phone,
          vehicle_type = :vehicleType,
          vehicle_color = :vehicleColor,
          category = :category,
          image_data_url = :imageDataUrl,
          registration_date = :registrationDate,
          valid_until = :validUntil,
          status = :status
        WHERE UPPER(plate_number) = UPPER(:originalPlate)`,
        { ...vehicle, originalPlate },
      );
      return send(res, 200, vehicle);
    }

    try {
      await pool.execute(
        `INSERT INTO vehicles (
          plate_number, owner_name, matric_or_staff_id, department, phone, vehicle_type,
          vehicle_color, category, image_data_url, registration_date, valid_until, status
        ) VALUES (
          :plateNumber, :ownerName, :matricOrStaffId, :department, :phone, :vehicleType,
          :vehicleColor, :category, :imageDataUrl, :registrationDate, :validUntil, :status
        )`,
        vehicle,
      );
    } catch (error) {
      if (error?.code === "ER_DUP_ENTRY") {
        return sendError(res, 409, "A vehicle with this plate number already exists");
      }
      throw error;
    }
    return send(res, 201, vehicle);
  }

  if (method === "PATCH" && vehiclePath) {
    if (!(await requireAdmin(req, res))) return;
    const body = await readJson(req);
    await pool.execute(
      "UPDATE vehicles SET status = :status WHERE UPPER(plate_number) = UPPER(:plate)",
      {
        plate: decodeURIComponent(vehiclePath[1]),
        status: body.status,
      },
    );
    return send(res, 200, { ok: true });
  }

  if (method === "DELETE" && vehiclePath) {
    if (!(await requireAdmin(req, res))) return;
    await pool.execute("DELETE FROM vehicles WHERE UPPER(plate_number) = UPPER(:plate)", {
      plate: decodeURIComponent(vehiclePath[1]),
    });
    return send(res, 200, { ok: true });
  }

  if (method === "GET" && path === "/api/logs") {
    if (!(await requireSession(req, res))) return;
    const [rows] = await pool.query("SELECT * FROM logs ORDER BY timestamp DESC");
    return send(res, 200, rows.map(fromLog));
  }

  if (method === "POST" && path === "/api/logs") {
    if (!(await requireSession(req, res))) return;
    const body = await readJson(req);
    const log = {
      id: crypto.randomUUID(),
      plateNumber: String(body.plateNumber ?? "")
        .trim()
        .toUpperCase(),
      type: body.type === "EXIT" ? "EXIT" : "ENTRY",
      officerUsername: String(body.officerUsername ?? "").trim(),
      result: body.result === "GRANTED" ? "GRANTED" : "DENIED",
      reason: body.reason ? String(body.reason) : null,
      timestamp: toMysqlDateTime(),
    };
    await pool.execute(
      `INSERT INTO logs (id, plate_number, type, timestamp, officer_username, result, reason)
       VALUES (:id, :plateNumber, :type, :timestamp, :officerUsername, :result, :reason)`,
      log,
    );
    return send(res, 201, log);
  }

  sendError(res, 404, "API route not found");
}

const server = http.createServer(async (req, res) => {
  try {
    await route(req, res);
  } catch (error) {
    console.error(error);
    sendError(res, error.status ?? 500, error.message ?? "Server error");
  }
});

server.listen(PORT, () => {
  console.log(`VIAS MySQL API running at http://localhost:${PORT}/api`);
});

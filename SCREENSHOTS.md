# System Screenshots, Captions, and Descriptions

This section presents the main interfaces and outputs of the Vehicle Identification and Authentication System (VIAS). The screenshots demonstrate the system's authentication, administration, vehicle-management, access-control, logging, reporting, export, and role-based features.

## Figure 1: VIAS Sign-In Page

**Caption:** VIAS user sign-in interface.

**Description:** This screen is the entry point to the Vehicle Identification and Authentication System. It provides username and password fields through which authorised administrators and security officers access the security portal. The page clearly identifies the system and its purpose: registering, monitoring, and authenticating vehicles.

## Figure 2: Administrator Dashboard

**Caption:** Administrator dashboard showing vehicle and gate-activity summary information.

**Description:** After a successful administrator login, the dashboard provides an at-a-glance summary of registered vehicles, blacklisted vehicles, expired registrations, security officers, and today's entries. The Recent Activity table displays recent gate authentication events, including the time, plate number, movement type, access result, and responsible officer. The sidebar provides access to all administrator functions.

## Figure 3: Vehicle Management Page

**Caption:** Vehicle management interface for viewing and maintaining registered vehicles.

**Description:** This page lists registered vehicles with their plate number, owner, category, vehicle details, validity date, and current access status. The search bar and status filter help administrators locate records quickly. The action icons allow an administrator to edit a vehicle, change its blacklist status, or delete its record, while the Register Vehicle button starts a new registration.

## Figure 4: Vehicle Registration Form

**Caption:** Vehicle registration form with image-upload support.

**Description:** Administrators use this form to add a vehicle to the campus access database. It captures the vehicle image, plate number, owner information, identity number, department, phone number, vehicle type and model, colour, category, registration date, and validity period. Required fields ensure that essential identification and access information is collected before the record is saved.

## Figure 5: Successful Gate Authentication

**Caption:** Gate authentication result for an authorised vehicle.

**Description:** The gate officer enters a plate number into the authentication field. In this example, the system identifies the vehicle as authorised and displays a prominent Access Granted result. The returned record includes the vehicle image, plate number, owner, staff or matriculation ID, department, vehicle information, category, validity date, and status. The successful decision is also logged automatically as an entry event.

## Figure 6: Vehicle List with Access Statuses

**Caption:** Registered-vehicle list showing authorised, blacklisted, and expired records.

**Description:** This view demonstrates how VIAS makes access status visible through labelled status badges. Administrators can distinguish active authorised vehicles from blacklisted and expired vehicles directly in the list. This supports rapid review and status administration before a vehicle reaches the gate.

## Figure 7: Gate Activity Logs

**Caption:** Gate movement log with search and filtering controls.

**Description:** The Logs page stores and displays vehicle authentication activity. Each log entry records the timestamp, plate number, entry or exit type, access result, officer, and reason for the decision. Search, movement-type filtering, date filtering, refresh, and print controls support the review of gate operations and audit information.

## Figure 8: User and Security-Officer Management

**Caption:** Administrator interface for creating and managing system users.

**Description:** This page enables an administrator to create accounts for administrators or security officers by entering a username, full name, password, and role. The table below shows existing accounts and their creation date, with an action to remove accounts where permitted. This feature supports role-based access control within VIAS.

## Figure 9: Reports Dashboard

**Caption:** Reports page showing summary indicators and the registered-vehicle report.

**Description:** The reporting dashboard generates information from the current MySQL records. Summary cards show the number of registered vehicles, blacklisted vehicles, expired vehicles, visitor vehicles, and today's entries. The report tables present detailed vehicle information, and the Export CSV and Print buttons allow the results to be shared or retained for administrative records.

## Figure 10: Exported Vehicle Report in CSV Format

**Caption:** CSV export of the registered-vehicle report opened in a spreadsheet application.

**Description:** This screenshot confirms that VIAS can export registered-vehicle data into a CSV file. The exported columns include plate number, owner, category, vehicle, colour, valid-until date, and status. The CSV output can be opened in spreadsheet software for offline review, printing, sharing, or further analysis.

## Figure 11: Security Officer Dashboard

**Caption:** Dashboard view available to a security officer.

**Description:** This screenshot demonstrates role-based access from an officer account. The officer can view operational information such as registered vehicles, blacklisted vehicles, expired vehicles, today's entries, and recent gate activity, and can proceed to vehicle authentication. Administrative-only menus, including Officers and Reports, are not available, preventing unauthorised user-management and reporting actions.

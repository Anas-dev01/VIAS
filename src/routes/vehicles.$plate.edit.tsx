import { createFileRoute } from "@tanstack/react-router";
import { RequireAuth } from "@/components/vias/RequireAuth";
import { VehicleFormPage } from "./vehicles.new";

export const Route = createFileRoute("/vehicles/$plate/edit")({
  component: EditWrapper,
});

function EditWrapper() {
  const { plate } = Route.useParams();
  return (
    <RequireAuth admin>
      <VehicleFormPage mode="edit" plate={plate} />
    </RequireAuth>
  );
}

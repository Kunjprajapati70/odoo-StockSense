import { DocumentList } from '../../features/documents/DocumentWorkspace';
import { deliveryService } from '../../services/inventoryService';

export default function Deliveries() {
  return (
    <DocumentList
      title="Delivery orders"
      description="Outgoing stock is reduced only when a delivery is validated, and only if the location has enough quantity."
      basePath="/deliveries"
      service={deliveryService}
      mode="delivery"
      partyKey="customer"
      partyLabel="Customer"
    />
  );
}

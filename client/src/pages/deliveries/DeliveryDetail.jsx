import { DocumentDetail } from '../../features/documents/DocumentWorkspace';
import { deliveryService } from '../../services/inventoryService';

export default function DeliveryDetail() {
  return <DocumentDetail service={deliveryService} mode="delivery" partyKey="customer" partyLabel="Customer" listPath="/deliveries" />;
}

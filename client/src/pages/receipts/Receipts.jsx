import { DocumentList } from '../../features/documents/DocumentWorkspace';
import { receiptService } from '../../services/inventoryService';

export default function Receipts() {
  return (
    <DocumentList
      title="Receipts"
      description="Incoming stock increases quantity only when a receipt is validated."
      basePath="/receipts"
      service={receiptService}
      mode="receipt"
      partyKey="supplier"
      partyLabel="Supplier"
    />
  );
}

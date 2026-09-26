import { DocumentDetail } from '../../features/documents/DocumentWorkspace';
import { receiptService } from '../../services/inventoryService';

export default function ReceiptDetail() {
  return <DocumentDetail service={receiptService} mode="receipt" partyKey="supplier" partyLabel="Supplier" listPath="/receipts" />;
}

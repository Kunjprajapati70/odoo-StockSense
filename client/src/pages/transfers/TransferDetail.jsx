import { DocumentDetail } from '../../features/documents/DocumentWorkspace';
import { transferService } from '../../services/inventoryService';

export default function TransferDetail() {
  return <DocumentDetail service={transferService} mode="transfer" partyLabel="Route" listPath="/transfers" />;
}

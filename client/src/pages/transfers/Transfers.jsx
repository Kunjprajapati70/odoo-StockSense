import { DocumentList } from '../../features/documents/DocumentWorkspace';
import { transferService } from '../../services/inventoryService';

export default function Transfers() {
  return (
    <DocumentList
      title="Internal transfers"
      description="Internal transfers move quantity between locations. Company stock does not change."
      basePath="/transfers"
      service={transferService}
      mode="transfer"
      partyLabel="Route"
    />
  );
}

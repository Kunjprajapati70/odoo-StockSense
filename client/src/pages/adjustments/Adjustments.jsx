import { DocumentList } from '../../features/documents/DocumentWorkspace';
import { adjustmentService } from '../../services/inventoryService';

export default function Adjustments() {
  return (
    <DocumentList
      title="Adjustments"
      description="Enter the physical count. Validation records the difference against the live system quantity."
      basePath="/adjustments"
      service={adjustmentService}
      mode="adjustment"
      partyKey="reason"
      partyLabel="Reason"
    />
  );
}

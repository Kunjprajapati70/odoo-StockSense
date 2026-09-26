import { DocumentDetail } from '../../features/documents/DocumentWorkspace';
import { adjustmentService } from '../../services/inventoryService';

export default function AdjustmentDetail() {
  return <DocumentDetail service={adjustmentService} mode="adjustment" partyKey="reason" partyLabel="Reason" listPath="/adjustments" />;
}

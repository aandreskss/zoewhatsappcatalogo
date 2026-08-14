import { Badge } from "@/components/ui/badge";
import {
  getCustomerSegment,
  CUSTOMER_SEGMENT_LABELS,
  CUSTOMER_SEGMENT_VARIANT,
  type SegmentInput,
} from "@/lib/domain/customers";

export function CustomerSegmentBadge({ customer }: { customer: SegmentInput }) {
  const segment = getCustomerSegment(customer);
  return (
    <Badge variant={CUSTOMER_SEGMENT_VARIANT[segment]}>
      {CUSTOMER_SEGMENT_LABELS[segment]}
    </Badge>
  );
}

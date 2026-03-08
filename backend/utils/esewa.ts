import crypto from "crypto";

// eSewa UAT credentials - for production, use env vars
const ESEWA_SECRET = process.env.ESEWA_SECRET || "8gBm/:&EnhH.1/q";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:3002";

/**
 * Generate HMAC-SHA256 signature for eSewa v2 form.
 * Message format: total_amount=X,transaction_uuid=Y,product_code=Z
 * Order must match signed_field_names: total_amount,transaction_uuid,product_code
 */
export function generateEsewaSignature(
  totalAmount: number,
  transactionUuid: string,
  productCode: string = ESEWA_PRODUCT_CODE
): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  const hmac = crypto.createHmac("sha256", ESEWA_SECRET);
  hmac.update(message);
  return hmac.digest("base64");
}

/**
 * Ensure transaction_uuid contains only alphanumeric and hyphen (eSewa requirement)
 */
export function sanitizeTransactionUuid(id: string): string {
  return String(id).replace(/[^a-zA-Z0-9-]/g, "");
}

export function buildEsewaFormData(params: {
  amount: number;
  transactionUuid: string;
  successPath: string;
  failurePath: string;
  taxAmount?: number;
  productServiceCharge?: number;
  productDeliveryCharge?: number;
}) {
  const {
    amount,
    transactionUuid,
    successPath,
    failurePath,
    taxAmount = 0,
    productServiceCharge = 0,
    productDeliveryCharge = 0,
  } = params;

  const totalAmount = amount + taxAmount + productServiceCharge + productDeliveryCharge;
  const uuid = sanitizeTransactionUuid(transactionUuid);
  const signature = generateEsewaSignature(totalAmount, uuid);

  const successUrl = `${FRONTEND_BASE_URL}${successPath}`;
  const failureUrl = `${FRONTEND_BASE_URL}${failurePath}`;

  return {
    amount: String(amount),
    tax_amount: String(taxAmount),
    total_amount: String(totalAmount),
    transaction_uuid: uuid,
    product_code: ESEWA_PRODUCT_CODE,
    product_service_charge: String(productServiceCharge),
    product_delivery_charge: String(productDeliveryCharge),
    success_url: successUrl,
    failure_url: failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature,
  };
}

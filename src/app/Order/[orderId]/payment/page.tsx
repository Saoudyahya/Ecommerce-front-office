import PaymentPageComponent from "./PaymComp";

interface PaymentPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { orderId } = await params;
  return <PaymentPageComponent orderId={orderId} />;
}

export async function generateMetadata({ params }: PaymentPageProps) {
  const { orderId } = await params;
  return {
    title: `Payment - Order #${orderId.slice(0, 8)}`,
    description: "Complete your order payment securely",
  };
}
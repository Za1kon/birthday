import Countdown from "@/components/countdown/Countdown";
import Celebration from "@/components/celebration/Celebration";

const BIRTHDAY = new Date("2025-03-18T00:00:00-03:00"); // UTC-3 Argentina

export default function Page() {
  const isBirthday = new Date() >= BIRTHDAY;
  return isBirthday ? <Celebration /> : <Countdown />;
}

// Revalidar cada 60 segundos para que el switch ocurra automáticamente en producción
export const revalidate = 60;
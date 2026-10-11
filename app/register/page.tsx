import Navbar from "@/components/Navbar";
import RegisterForm from "@/components/RegisterForm";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  return (
    <main className="relative">
      <Navbar ctaLabel="Kembali ke Beranda" ctaHref="/" />
      <RegisterForm />
      <Footer />
    </main>
  );
}

import Navbar from "@/components/Navbar";
import LoginForm from "@/components/LoginForm";
import Footer from "@/components/Footer";

export default function LoginPage() {
  return (
    <main className="relative">
      <Navbar ctaLabel="Kembali ke Beranda" ctaHref="/" />
      <LoginForm />
      <Footer />
    </main>
  );
}

import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "TaskFlow — Premium Task Management & To-Do List",
  description: "Stay organized and productive with a modern, glassmorphic task tracker connected to Supabase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

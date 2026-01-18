import SignUpForm from "../components/SignUpForm";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const navigate = useNavigate();

  return (
    <SignUpForm onSignUpSuccess={() => navigate("/")} />
  );
}

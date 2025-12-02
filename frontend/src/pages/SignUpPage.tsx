import { useAuthStore } from "../useAuthStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function SignUpPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  return <div>Sign up</div>;
}

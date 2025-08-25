import { Navigate } from "react-router-dom";

export default function PublicRoute({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem("userId");
  if (user) {
    return <Navigate to="/index" replace />;
  }
  return children;
}

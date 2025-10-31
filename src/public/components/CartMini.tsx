import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartMini() {
  const { count } = useCart();
  return (
    <Link to="/korpa" className="relative inline-flex items-center gap-1 text-amber-700">
      <span>Корпа</span>
      <span className="inline-flex items-center justify-center text-xs bg-amber-500 text-white rounded-full px-2 py-0.5">
        {count}
      </span>
    </Link>
  );
}

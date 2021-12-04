import Profile from "components/profile";
import { useParams } from "react-router-dom";

export default function UserProfile() {
  const { id } = useParams();
  if (!id) {
    return null;
  }

  return <Profile id={id} />;
}

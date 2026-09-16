import { useAppContext } from "../store/AppContext.jsx";

export function useInterviewSession() {
  const { session, setSession } = useAppContext();
  return { session, setSession };
}

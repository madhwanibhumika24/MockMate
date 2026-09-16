import { useParams } from "react-router-dom";

function Feedback() {
  const { sessionId } = useParams();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="text-xl font-semibold">Feedback for session {sessionId}</h2>
      {/* TODO: strengths / improvements, RAG-grounded references */}
    </div>
  );
}

export default Feedback;

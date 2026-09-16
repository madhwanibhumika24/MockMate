import { useParams } from "react-router-dom";

function Interview() {
  const { sessionId } = useParams();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h2 className="text-xl font-semibold">Interview session {sessionId}</h2>
      {/* TODO: question display, answer input, progress indicator */}
    </div>
  );
}

export default Interview;

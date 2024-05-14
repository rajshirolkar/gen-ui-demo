interface PollCardProps {
  poll: {
    question: string;
    options: string[];
  };
}

export default function PollCard({ poll }: PollCardProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{poll.question}</h2>
      <form>
        {poll.options.map((option, index) => (
          <label key={index} className="block mb-2">
            <input type="radio" name="poll" value={option} className="mr-2" />
            {option}
          </label>
        ))}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

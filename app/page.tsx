"use client";

import { useState } from "react";
import { ClientMessage } from "./action";
import { useActions, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [conversation, setConversation] = useUIState();
  const { continueConversation } = useActions();

  return (
    <div className="flex flex-col space-y-4">
      <div>
        {conversation.map((message: ClientMessage) => (
          <div key={message.id}>
            {message.role}: {message.display}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          className="border border-border rounded-md p-2 w-1/3 focus:outline-none"
        />
        <button
          onClick={async () => {
            setConversation((currentConversation: ClientMessage[]) => [
              ...currentConversation,
              { id: nanoid(), role: "user", display: input },
            ]);

            const message = await continueConversation(input);

            setConversation((currentConversation: ClientMessage[]) => [
              ...currentConversation,
              message,
            ]);

            setInput("");
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// "use client";

// import { useState } from "react";
// import { useUIState, useActions } from "ai/rsc";
// import { type AI } from "./action";
// import { UserMessage } from "@/components/message";

// export default function Page() {
//   const [inputValue, setInputValue] = useState("");
//   const [messages, setMessages] = useUIState<typeof AI>();
//   const { submitMessage } = useActions();

//   return (
//     <div className="flex flex-col space-y-4">
//       {
//         // View messages in UI state
//         messages.map((message) => (
//           <div key={message.id}>{message.display}</div>
//         ))
//       }

//       <form
//         onSubmit={async (e) => {
//           e.preventDefault();

//           const value = inputValue.trim();

//           // Add user message to UI state
//           setMessages((currentMessages) => [
//             ...currentMessages,
//             {
//               id: Date.now(),
//               display: <UserMessage>{value}</UserMessage>,
//             },
//           ]);

//           // Submit and get response message
//           const responseMessage = await submitMessage(inputValue);
//           setMessages((currentMessages) => [
//             ...currentMessages,
//             responseMessage,
//           ]);

//           setInputValue("");
//         }}
//       >
//         <input
//           placeholder="Send a message... (e.g. What is the weather in SF?)"
//           value={inputValue}
//           onChange={(event) => {
//             setInputValue(event.target.value);
//           }}
//           className="border border-border rounded-md p-2 w-1/3 focus:outline-none"
//         />
//       </form>
//     </div>
//   );
// }

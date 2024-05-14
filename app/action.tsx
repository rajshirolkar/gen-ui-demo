"use server";

import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { openai } from "@ai-sdk/openai";
import { ReactNode } from "react";
import { z } from "zod";
import { generateObject } from "ai";
import { nanoid } from "nanoid";
import { Spinner } from "@/components/spinner";
import PollCard from "@/components/poll-card";
import WeatherCard from "@/components/weather-card";

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  const result = await streamUI({
    model: openai("gpt-3.5-turbo"),
    messages: [...history.get(), { role: "user", content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }

      return <div>{content}</div>;
    },
    tools: {
      deploy: {
        description: "Deploy repository to vercel",
        parameters: z.object({
          repositoryName: z
            .string()
            .describe("The name of the repository, example: vercel/ai-chatbot"),
        }),
        generate: async function* ({ repositoryName }) {
          yield <div>Cloning repository {repositoryName}...</div>; // [!code highlight:5]
          await new Promise((resolve) => setTimeout(resolve, 3000));
          yield <div>Building repository {repositoryName}...</div>;
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return <div>{repositoryName} deployed!</div>;
        },
      },
      get_city_weather: {
        description: "Get the current weather for a city",
        parameters: z.object({
          city: z
            .string()
            .describe("The city and state, e.g. San Francisco, CA"),
        }),
        generate: async function* ({ city }) {
          yield <Spinner />;
          // Assume getWeather is implemented and returns an object with the structure expected by WeatherCard
          const weather = await getWeather(city);
          return <WeatherCard info={weather} />;
        },
      },

      // Tool for generating a poll
      generate_poll: {
        description: "Generate a poll about a given topic",
        parameters: z.object({
          topic: z.string().describe("The topic for the poll, e.g., Jupiter"),
        }),
        generate: async function* ({ topic }) {
          yield <Spinner />;
          // Assume generatePoll is implemented and returns an object with the structure expected by PollCard
          const poll = await generatePoll(topic);
          return <PollCard poll={poll} />;
          // yield <PollCard poll={poll} />;
        },
      },
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

// Dummy function for generatePoll
// async function generatePoll(topic: string): Promise<any> {
//   // This is a mock function. Replace it with your actual poll generation logic.
//   console.log(`Generating poll for ${topic}...`);
//   // Simulate a delay
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   // Return a mock poll data
//   return {
//     question: `What do you think about ${topic}?`,
//     options: [
//       "Option 1: It's fascinating",
//       "Option 2: It's interesting",
//       "Option 3: It's okay",
//       "Option 4: I'm not interested",
//     ],
//   };
// }
async function generatePoll(topic: string): Promise<any> {
  console.log(`Generating poll for ${topic}...`);

  // Define the schema for the poll
  const pollSchema = z.object({
    question: z.string(),
    options: z.array(z.string()),
  });

  // Construct the prompt for the OpenAI API
  const prompt = `Create a poll question and four options about ${topic}.`;

  try {
    // Use the generateObject function with the defined schema and prompt
    const { object: poll } = await generateObject({
      model: openai("gpt-3.5-turbo"), // Ensure this is the correct function to call the OpenAI model
      schema: pollSchema,
      prompt: prompt,
    });

    // Return the structured poll data
    return poll;
  } catch (error) {
    console.error("Error generating poll:", error);
    throw error;
  }
}

// Dummy function for getWeather
async function getWeather(city: string): Promise<any> {
  // This is a mock function. Replace it with your actual weather fetching logic.
  console.log(`Fetching weather for ${city}...`);
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Return a mock weather data
  return {
    city,
    temperature: 7,
    high: 12,
    low: 1,
    weatherType: "Sunny",
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});

// import { createAI, getMutableAIState } from "ai/rsc";
// import OpenAI from "openai";
// import { openai as _openai } from "@ai-sdk/openai";
// import { z } from "zod";
// import { generateObject } from "ai";
// import { Spinner } from "@/components/spinner";
// import { BotMessage } from "@/components/message";
// import WeatherCard from "@/components/weather-card";
// import PollCard from "@/components/poll-card";

// const openai = new OpenAI();

// async function submitMessage(content: string) {
//   "use server";

//   const aiState = getMutableAIState<typeof AI>();

//   // Update AI state with new message.
//   aiState.update([
//     ...aiState.get(),
//     {
//       role: "user",
//       content: content,
//     },
//   ]);

//   const ui = render({
//     provider: openai,
//     model: "gpt-3.5-turbo",
//     messages: [
//       { role: "system", content: "You are a helpful assistant" },
//       { role: "user", content },
//     ],
//     // `text` is called when an AI returns a text response (as opposed to a tool call)
//     text: ({ content, done }) => {
//       // text can be streamed from the LLM, but we only want to close the stream with .done() when its completed.
//       // done() marks the state as available for the client to access
//       if (done) {
//         aiState.done([
//           ...aiState.get(),
//           {
//             role: "assistant",
//             content,
//           },
//         ]);
//       }
//       return <BotMessage>{content}</BotMessage>;
//     },
//     tools: {
//       get_city_weather: {
//         description: "Get the current weather for a city",
//         parameters: z
//           .object({
//             city: z
//               .string()
//               .describe("The city and state, e.g. San Francisco, CA"),
//           })
//           .required(),
//         render: async function* (args) {
//           yield <Spinner />;

//           // Workaround for a bug in the current version (v3.0.1)
//           // issue: https://github.com/vercel/ai/issues/1026
//           const { city } = JSON.parse(args as unknown as string);
//           console.log(city); // This is the correct

//           const weather = await getWeather(city);

//           aiState.done([
//             ...aiState.get(),
//             {
//               role: "function",
//               name: "get_weather_info",
//               // Content can be any string to provide context to the LLM in the rest of the conversation
//               content: JSON.stringify(weather),
//             },
//           ]);

//           return (
//             <BotMessage>
//               <WeatherCard info={weather} />
//             </BotMessage>
//           );
//         },
//       },
//       generate_poll: {
//         description: "Generate a poll about a given topic",
//         parameters: z
//           .object({
//             topic: z.string().describe("The topic for the poll, e.g., Jupiter"),
//           })
//           .required(),
//         execute: async function* (args) {
//           yield <Spinner />;

//           // Workaround for a bug in the current version (v3.0.1)
//           // issue: https://github.com/vercel/ai/issues/1026
//           const { topic } = JSON.parse(args as unknown as string);
//           console.log(topic); // This logs the topic

//           const poll = await generatePoll(topic);

//           aiState.done([
//             ...aiState.get(),
//             {
//               role: "function",
//               name: "generate_poll",
//               content: JSON.stringify(poll),
//             },
//           ]);

//           // Here you would return a component that renders the poll
//           // For now, let's just log the poll to the console
//           console.log(poll);

//           // Return a placeholder message until the poll component is implemented
//           return (
//             <BotMessage>
//               <PollCard poll={poll} />
//             </BotMessage>
//           );
//         },
//       },
//     },
//   });

//   return {
//     id: Date.now(),
//     display: ui,
//   };
// }

// // Dummy function for generatePoll
// async function generatePoll(topic: string): Promise<any> {
//   // This is a mock function. Replace it with your actual poll generation logic.
//   console.log(`Generating poll for ${topic}...`);
//   // Simulate a delay
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   // Return a mock poll data
//   return {
//     question: `What do you think about ${topic}?`,
//     options: [
//       "Option 1: It's fascinating",
//       "Option 2: It's interesting",
//       "Option 3: It's okay",
//       "Option 4: I'm not interested",
//     ],
//   };
// }
// // async function generatePoll(topic: string): Promise<any> {
// //   console.log(`Generating poll for ${topic}...`);

// //   // Define the schema for the poll
// //   const pollSchema = z.object({
// //     question: z.string(),
// //     options: z.array(z.string()),
// //   });

// //   // Construct the prompt for the OpenAI API
// //   const prompt = `Create a poll question and four options about ${topic}.`;

// //   try {
// //     // Use the generateObject function with the defined schema and prompt
// //     const { object: poll } = await generateObject({
// //       model: _openai("gpt-3.5-turbo"), // Ensure this is the correct function to call the OpenAI model
// //       schema: pollSchema,
// //       prompt: prompt,
// //     });

// //     // Return the structured poll data
// //     return poll;
// //   } catch (error) {
// //     console.error("Error generating poll:", error);
// //     throw error;
// //   }
// // }

// // Dummy function for getWeather
// async function getWeather(city: string): Promise<any> {
//   // This is a mock function. Replace it with your actual weather fetching logic.
//   console.log(`Fetching weather for ${city}...`);
//   // Simulate a delay
//   await new Promise((resolve) => setTimeout(resolve, 1000));
//   // Return a mock weather data
//   return {
//     city,
//     temperature: 7,
//     high: 12,
//     low: 1,
//     weatherType: "Sunny",
//   };
// }

// const initialAIState: {
//   role: "user" | "assistant" | "system" | "function";
//   content: string;
//   id?: string;
//   name?: string;
// }[] = [];

// const initialUIState: {
//   id: number;
//   display: React.ReactNode;
// }[] = [];

// export const AI = createAI({
//   actions: {
//     submitMessage,
//   },
//   // Each state can be any shape of object, but for chat applications
//   // it makes sense to have an array of messages. Or you may prefer { id: number, messages: Message[] }
//   initialUIState,
//   initialAIState,
// });

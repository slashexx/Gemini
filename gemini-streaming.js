import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import readline from "readline"


dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let isAwaitingResponse = false; //* flag to indicate if we are waiting for the reason

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({
    history: [], //* start with an empty history
    generationConfig: {
      maxOutputTokens: 500,
    },
  });

  async function askAndRespond() {
    if (!isAwaitingResponse) {
      // * check if not currently awaiting a response
      rl.question("You : ", async (msg) => {
        if (msg.toLowerCase() === "exit") {
          rl.close();
        } else {
          isAwaitingResponse = true; //* set flag to true as we start receiving the stream
          try {
            const result = await chat.sendMessageStream(msg);
            let text = "";
            for await (const chunk of result.stream) {
              const chunkText = await chunk.text(); //* assuming chunk.text returns a promise
              console.log("AI : ", chunkText);
              text += chunkText;
            }
            isAwaitingResponse = false; //* Reset flag after stream is complete
            askAndRespond() //* Ready for the next input
          } catch (error) {
            console.log("Error : ", error);
            isAwaitingResponse = false; //* Ensure flag is reset on errors too !
          }
        }
      });
    } else {
      console.log("Please wait for the current response to complete");
    }
  }
  askAndRespond();
}
run();

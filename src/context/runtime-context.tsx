import { AssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter, type ChatModelRunOptions, type ChatModelRunResult } from "@assistant-ui/react";
import { v4 as uuidv4 } from 'uuid';

const Adapter: ChatModelAdapter = {
    async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult, void, unknown> {
  
      const {messages, abortSignal} = options
  
      const lastMessage = messages[messages.length - 1]
    
      try {
        const response = await fetch(
            `http://localhost:3001/chat`,
            {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                signal: abortSignal,
                body: JSON.stringify({
                  message: lastMessage.content[0].type === 'text' ? lastMessage.content[0].text : '',
                }),
            },
        );
  
        if (!response.body) {
            throw new Error('No response body');
        }
  
        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorDetails = JSON.parse(errorText);
                throw new Error(errorDetails?.detail || 'An unknown error occurred');
            } catch {
                throw new Error(errorText || 'An unknown error occurred');
            }
        }
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
  
        let buffer = '';
        let currentEvent = '';
        const toolCalls: Array<{
          type: "tool-call";
          toolCallId: string;
          toolName: string;
          args: Record<string, string | number | boolean | null>;
          argsText: string;
          result: unknown;
        }> = [];
  
        while (true) {
            const { done, value } = await reader.read();
  
            if (done) {
                break;
            }
  
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
  
            for (const line of lines) {
                if (line.startsWith('event:')) {
                    currentEvent = line.substring(6).trim();
                } else if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim();
                    if (!jsonStr) continue;
  
                    try {
                        const parsed = JSON.parse(jsonStr);
                        
                        if (currentEvent === 'text' && parsed && typeof parsed.text === 'string') {
                            accumulatedText += parsed.text;
                        } else if (currentEvent === 'tool_call' && parsed && parsed.tool_result) {
                            toolCalls.push({
                                type: "tool-call",
                                toolCallId: `tool_${uuidv4()}`,
                                toolName: parsed.tool_name,
                                args: {},
                                argsText: '',
                                result: parsed.tool_result
                            });
                        }
                    } catch (error) {
                        console.warn('Error parsing stream JSON:', error);
                    }
                }
            }
  
            // Build content array with text and tool calls  
            const content: Array<{ type: "text"; text: string } | { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, string | number | boolean | null>; argsText: string; result: unknown }> = [];
            
            if (accumulatedText) {
                content.push({ type: "text", text: accumulatedText });
            }
            
            if (toolCalls.length > 0) {
                content.push(...toolCalls);
            }
  
            yield {
              content: content.length > 0 ? content as ChatModelRunResult['content'] : [{ type: "text", text: accumulatedText }],
            };
  
        }
    } catch (err: unknown) {
        console.error(err);
    } finally {
        console.log('finished')
    }
    }
  }
  


export function RuntimeProvider({ children }: { children: React.ReactNode }) {
  const runtime = useLocalRuntime(Adapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
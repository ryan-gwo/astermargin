import {afterEach,describe,it,expect,vi} from "vitest";
import {createGeminiClient} from "../../../packages/agent-local/src/llm/geminiClient";
import {clientForFormat} from "../../../packages/agent-local/src/llm/clientForFormat";

const model={api_key:"fixture-only",api_base:"https://gemini.example/v1beta",name:"test",snapshot:"test-model",format:"gemini" as const};
afterEach(()=>vi.unstubAllGlobals());
describe("Gemini native transport",()=>{
    it("streams thinking and text separately, sends image bytes and retains tool-call signatures for a follow-up",async()=>{
        let payload:any,headers:any,url="";
        const chunks=[
            {candidates:[{content:{parts:[{text:"plan",thought:true}]}}]},
            {candidates:[{content:{parts:[{text:"Read "},{text:"this."},{thoughtSignature:"sig",functionCall:{id:"g-1",name:"lookup",args:{q:"redshift"}}}]},finishReason:"STOP"}],usageMetadata:{promptTokenCount:5,candidatesTokenCount:9}},
        ];
        vi.stubGlobal("fetch",async(u:string,i:any)=>{url=u;payload=JSON.parse(i.body);headers=i.headers;return new Response(chunks.map(x=>"data: "+JSON.stringify(x)+"\n\n").join(""));});
        const text=vi.fn(),think=vi.fn(),client=clientForFormat("gemini"),signal=new AbortController().signal;
        const first=await client.streamTurn({model,tools:[],messages:[{role:"system",content:"system"},{role:"user",content:"inspect",images:["pngbytes"]}]},{onTextDelta:text,onThinkingDelta:think},signal);
        expect(url).toBe("https://gemini.example/v1beta/models/test-model:streamGenerateContent?alt=sse");
        expect(headers["x-goog-api-key"]).toBe("fixture-only");expect(payload.contents[0].parts[1]).toEqual({inlineData:{mimeType:"image/png",data:"pngbytes"}});
        expect(first.text).toBe("Read this.");expect(think).toHaveBeenCalledWith("plan");expect(first.finishReason).toBe("tool_calls");
        await client.streamTurn({model,tools:[],messages:[{role:"assistant",content:first.text,toolCalls:first.toolCalls,providerBlocks:first.providerBlocks},{role:"tool",content:"result",toolCallId:"g-1"}]},{onTextDelta(){},onThinkingDelta(){}},signal);
        expect(payload.contents[0].parts.at(-1).thoughtSignature).toBe("sig");expect(payload.contents[1].parts[0].functionResponse.name).toBe("lookup");
    });
    it("does not return partial text as a successful response after a truncated stream",async()=>{
        vi.stubGlobal("fetch",async()=>new Response('data: {"candidates":[{"content":{"parts":[{"text":"partial"}]}}]}\n\n'));
        await expect(createGeminiClient().streamTurn({model,tools:[],messages:[{role:"user",content:"test"}]},{onTextDelta(){},onThinkingDelta(){}},new AbortController().signal)).rejects.toThrow("incomplete stream");
    });
});

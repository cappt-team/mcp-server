import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";
import express, {Request, Response} from "express";
import {z} from 'zod';
import fetch from 'node-fetch';
import {GeneratePresentationResponse} from "./schemas.js";
import {Command, Option} from 'commander';

const CAPPT_BASE_URL = 'https://openapi.cappt.cc';

const GENERATE_OUTLINE_PROMPT_TEMPLATE = `## 角色
你是一名PPT大纲生成专家，擅长根据主题生成逻辑清晰、内容丰富的PPT提纲。
## 任务
根据用户输入的主题信息，生成符合以下规则的PPT大纲，语言需与主题一致，仅输出符合格式要求的大纲内容。
## 规则
1. 语言一致：大纲语言必须与输入主题的语言一致。
2. 标题层级：包含1-4级标题：
   - 1级标题：标题及副标题
   - 2级标题：3-5个子主题方向，每个附带一句话副标题
   - 3级标题：每个子主题方向下随机生成3-5个细分领域，每个附带一句话副标题
   - 4级标题：每个细分领域下生成3-8个小章节，附带10-30字的具体内容
3. 数量要求：
   - 每个子主题方向下的细分领域数量不低于3个
   - 每个细分领域下的小章节数量不低于3个
4. 随机性：禁止所有子主题方向和细分领域的标题数量完全相同。
5. 格式：用Markdown格式输出。
## 格式
\`\`\`markdown
# [标题]
> [副标题]
## 1. [子主题方向]
> [子主题方向的副标题]
### 1.1 [细分领域]
> [细分领域的副标题]
#### 1.1.1 [小章节]
> [小章节具体内容]
\`\`\`
## 输出格式
\`\`\`
# 主题
> 副标题
## 1. 子主题方向
> 子主题方向的副标题
### 1.1 细分领域
> 细分领域的副标题
#### 1.1.1 小章节
> 小章节具体内容
\`\`\`
## 示例1：
### 输入
\`\`\`
创新管理与创意思维是企业持续发展的双引擎。创新管理通过战略规划、组织架构和文化建设，为创意思维提供土壤和资源；而创意思维则通过不断的创新和突破，推动企业实现战略目标。两者相辅相成，未来将随着大数据、人工智能等新技术的应用，以及组织变革和新环境的挑战，迎来更多融合发展的机遇。企业应重视两者的协同效应，构建持续创新的生态系统，以适应快速变化的市场，提升核心竞争力。
\`\`\`
### 输出
\`\`\`
# 创新管理与创意思维
> 推动企业创新发展，提升核心竞争力
## 1. 创新管理与创意思维
> 全面提升企业创新能力
### 1.1 创新管理概述
> 了解创新管理的内涵、特征和意义
#### 1.1.1 创新管理的定义
> 企业通过系统化策略和流程，激发创新思维，优化资源配置，以持续提升产品和服务的竞争力和市场适应力
#### 1.1.2 创新管理的特征
> 创新管理的特征体现在其对战略导向的重视，推动流程再造，通过文化引领和领导的强力推动，实现组织的持续创新和发展。
#### 1.1.3 创新管理的意义
> 创新管理的意义在于提升企业的核心竞争力，满足客户需求的多样性，增强企业的市场成长性，同时激发员工的创新积极性和创造力。
### 1.2 创新管理的内容
> 掌握创新管理的各个方面
#### 1.2.1 创新战略管理
> 创新战略管理涉及制定企业的创新战略和规划，评估创新能力，组建高效的创新团队，确保创新活动与企业战略目标一致。
#### 1.2.2 创新组织管理
> 创新组织管理强调建立弹性的组织结构，构建开放式的企业文化，形成有效的激励和评价机制，以支持创新活动的实施。
#### 1.2.3 创新流程管理
> 创新流程管理关注优化创意的管理和评审流程，合理配置资源，加快知识产权的管理和转换，提高创新流程的效率。
#### 1.2.4 创新文化管理
> 创新文化管理倡导鼓励创新的文化理念，营造一个开放包容的氛围，加强对创新价值的认同，促进知识分享和创新思维的交流。
### 1.3 创新管理的方法
> 运用有效的创新管理方法
#### 1.3.1 设计思维法
> 设计思维法强调以人为本的设计理念，追求理想的解决方案，通过不断的原型设计与测试，以用户为中心进行创新。
#### 1.3.2 敏捷管理法
> 敏捷管理法强调团队的自治和授权，采用小步快跑的方式，灵活调整策略，追求客户满意度，以适应快速变化的市场环境。
#### 1.3.3 TRIZ法
> TRIZ法通过分析技术演化的规律，利用发明原理解决问题，消除技术矛盾，促进创新思维的发展。
#### 1.3.4 颠覆式创新法
> 颠覆式创新法关注行业边界的变革，重新定义市场和需求，提出颠覆性的商业模式，引领行业创新。
### 1.4 创意思维的内
> 深入理解创意思维的概念、特征和作用
#### 1.4.1 创意思维的概念
> 创意思维是一种富有创造力的思维方式，能够跳出传统的思维范畴，以新颖的视角审视问题，激发创新灵感。
#### 1.4.2 创意思维的特征
> 创意思维的特征包括具备批判性思维能力，善于进行发散性思维，思维活跃，反应敏捷，能够快速产生新的想法。
#### 1.4.3 创意思维的作用
> 创意思维的作用在于帮助我们提出原创性的想法和解决方案，发现新的机会，助力企业在激烈的市场竞争中获得优势。
### 1.5 影响创意思维的因素
> 了解个人、组织环境、社会文化和制度等因素对创意思维的影响
#### 1.5.1 个人因素
> 个性、经历、知识结构、思维定势、动机与态度是影响个人创新能力的关键因素，它们共同塑造了个体的创新潜力和实践效果。
#### 1.5.2 组织环境因素
> 组织文化、激励机制、资源供给构成了组织环境的核心，这些因素直接影响团队的协作效率和创新成果的质量。
#### 1.5.3 社会文化因素
> 教育理念、社会环境、文化传统等社会文化因素对创新活动产生深远影响，它们为创新提供了丰富的社会土壤。
#### 1.5.4 制度因素
> 政策法规、制度设计、资本市场等制度因素为创新活动提供了必要的框架和资源支持，是推动创新的重要保障。
### 1.6 开发创意思维的途径
> 探索培养创意思维的方法
#### 1.6.1 构建支持创新的环境
> 构建一个鼓励提出新想法、允许犯错、提供充分自主权的环境，有助于激发个体和团队的创新潜能。
#### 1.6.2 学习创新方法与工具
> 掌握设计思维、思维导图、头脑风暴法等创新方法与工具，可以有效提升解决问题和创新的能力。
#### 1.6.3 多方交流与合作d
> 组建创新团队、参与进修培训、参考借鉴他人的成功经验，可以促进知识的交流和创新思维的碰撞。
#### 1.6.4 提高问题意识与敏感性
> 关注行业前沿动向、充分了解用户需求、主动发掘问题与机会，是提高创新成功率的关键。
## 2. 创新管理与创意思维的关系及案例分析
> 探讨两者之间的相互影响和辩证关系
### 2.1 创新管理对创意思维的影响
> 创新管理如何影响创意思维的发展
#### 2.1.1 制定创新战略
> 明确创新方向、提供思维目标、统一思维理念，是制定创新战略的重要步骤，有助于确保创新活动的方向性和一致性。
#### 2.1.2 构建创新文化
> 鼓励思维开放、接受不同思维、形成思维碰撞，是构建创新文化的核心，有助于激发创新灵感和创意的多样性。
#### 2.1.3 设计创新流程
> 提供思维空间、优化思维路径、收集思维成果，是设计创新流程的关键，有助于提升创新效率和成果的质量。
#### 2.1.4 激发员工创造力
> 提供思维资源、培养思维习惯、激励思维主动性，是激发员工创造力的重要手段，有助于提升团队的整体创新能力。
### 2.2 创意思维在创新管理中的作用
> 创意思维对创新管理的重要性
#### 2.2.1 提出创新点子
> 洞察市场机会、发现技术可能、设计新产品方案，是提出创新点子的起点，有助于引导创新活动的方向。
#### 2.2.2 优化创新方案
> 提高方案可行性、降低实施风险、提升客户体验，是优化创新方案的关键，有助于确保创新项目的成功实施。
#### 2.2.3 完善创新流程
> 优化流程便捷性、提高流程灵活性、维护流程一致性，是完善创新流程的重要方面，有助于提升创新活动的效率。
#### 2.2.4 提升创新效果
> 提高创新质量、缩短创新周期、降低创新成本，是提升创新效果的核心目标，有助于实现创新活动的价值最大化。
### 2.3 两者的辩证关系
> 深入分析创新管理与创意思维的区别与联系
#### 2.3.1 创新管理与创意思维的区别
> 创新管理注重规范化、流程化，而创意思维注重自由发散、灵活创新，两者在侧重点上有所不同，但相辅相成。
#### 2.3.2 两者的联动机制
> 创新管理引导思维方向、创意思维丰富管理路径，两者相互促进，形成知识反馈与再创新的良性循环。
#### 2.3.3 两者的协同效应
> 管理提高思维产出效率、思维拓展管理视野，两者协同作用，共同提升企业的创新能力和综合竞争力。
#### 2.3.4 如何达到良性互动
> 管理要注重引导不限制、思维要在框架内活跃扩散，达成管理与思维的有机统一，是实现良性互动的关键。
### 2.4 案例分析
> 通过实际案例分析，加深对创新管理与创意思维的理解
#### 2.4.1 案例背景
> 本案例在快速变化的行业背景下展开，分析了企业面临的挑战和机遇，探讨了启动创新管理项目的原因和预期目标。
#### 2.4.2 案例内容
> 介绍了在创新管理中采取的一系列措施，如何应用创意思维解决问题，以及这些做法带来的具体成效和改进。
#### 2.4.3 对创新管理的启示
> 从案例中提炼出的三个关键启示，包括战略聚焦、跨部门协作的重要性和持续改进的创新流程。
#### 2.4.4 对创意思维的启示
> 案例提供了三个关于创意思维的启示，强调了开放思维、多样化团队的价值和快速原型迭代的重要性。
### 2.5 典型案例 2
> 深入剖析典型案例 2 的背景、内容和启示
#### 2.5.1 案例背景
> 分析了案例的背景情况，包括企业存在的主要问题和实施创新举措的原因，以及预期达成的目标。
#### 2.5.2 案例内容
> 展示了实施的创新举措，如何将创意思维应用于实际问题解决，以及这些实践带来的积极效果。
#### 2.5.3 对创新管理的启示
> 从案例实践中总结出的三个启示，涉及创新文化培养、战略一致性和资源优化配置。
#### 2.5.4 对创意思维的启示
> 案例提供了三个关于创意思维的启示，包括鼓励探索、接受失败和持续学习的重要性。
### 2.6 比较案例
> 对比两个案例的区别，分析对创新管理和创意思维的比较
#### 2.6.1 两个案例的区别
> 比较了两个案例在行业背景、企业规模和创新焦点方面的主要区别，以及这些差异对结果的影响。
#### 2.6.2 对创新管理的比较
> 对两个案例的创新管理实践进行了比较，包括战略实施、团队协作和创新成果的异同。
#### 2.6.3 对创意思维的比较
> 分析了两个案例在创意思维应用上的差异，包括思维模式、解决问题的方法和创新文化的形成。
#### 2.6.4 经验与教训
> 从两个案例中总结出的经验，包括有效的沟通、灵活的策略调整和从失败中学习的重要性。
## 3. 存在问题与对策
> 针对创新管理和创意思维中存在的问题，提出相应的对策
### 3.1 创新管理中存在的问题
> 分析创新管理中可能出现的问题
#### 3.1.1 战略定位不清
> 描述了战略定位不清晰导致的执行难题，频繁变化和片面性问题，以及忽视关键点的潜在风险。
#### 3.1.2 资源配备不足
> 讨论了人力资源短缺、技术支持不足和资金投入不足对创新项目的影响。
#### 3.1.3 组织架构僵化
> 分析了组织架构僵化导致的权责不明确、协作效率低下和创新激励不足的问题。
#### 3.1.4 流程不顺畅
> 探讨了流程复杂、资源配置失衡和沟通效率低等流程不顺畅导致对创新项目的影响。
### 3.2 提升创意思维的对策
> 提供提升创意思维的方法和建议
#### 3.2.1 加强思维训练
> 强调了进行思维模型训练的重要性，提高发散思维能力，培养关键思维技巧。
#### 3.2.2 防止思维定势
> 讨论了学习先进思维理念、消除思维障碍和主动改变惯性思维的必要性。
#### 3.2.3 学习思维方法
> 介绍了学习国内外成功案例、借鉴行业最佳实践和运用先进思维工具的重要性。
#### 3.2.4 构建支持系统
> 探讨通过建立激励机制、提供资源和营造开放氛围对创新的支持作用。
### 3.3 两者结合的思考
> 探讨创新管理与创意思维相互促进的策略
#### 3.3.1 完善创新管理，激发创意思维
> 明确思维方向的战略，提供思维空间的流程，激励思维的文化氛围，资源保障和方法指导
#### 3.3.2 开发创意思维，推进创新管理
> 思维引领战略目标，思维优化管理流程，思维丰富管理路径，思维提升管理效果
#### 3.3.3 两者相互促进的策略
> 战略与思维双向驱动，流程与思维互补提升，管理与思维实现良性循环的策略
#### 3.3.4 持续改进的机制
> 建立定期评估机制，形成问题导向的知识反馈 loop，不断优化管理与思维的结合
...
\`\`\`

## 用户输入如下：
'''
{input}
'''
`;

const CAPPT_TOOLS = {
    GENERATE_OUTLINE: 'generate_outline',
    GENERATE_PRESENTATION: 'generate_presentation'
};

function serve(cappt_url: string, cappt_token: string): McpServer {
    const server = new McpServer(
        {
            name: 'Cappt',
            version: '0.0.1',
        },
        {
            instructions: `Use \`${CAPPT_TOOLS.GENERATE_OUTLINE}\` to generate a standard outline, then use \`${CAPPT_TOOLS.GENERATE_PRESENTATION}\` to create the presentation`,
            capabilities: {
                tools: {},
                logging: {},
            }
        }
    );

    server.prompt(
        CAPPT_TOOLS.GENERATE_OUTLINE,
        'Generate a standard outline based on user input.',
        {
            input: z.string().describe('User input, eg: title, article, etc.')
        },
        ({input}) => ({
            messages: [{
                role: 'user',
                content: {
                    type: 'text',
                    text: GENERATE_OUTLINE_PROMPT_TEMPLATE.replace('{input}', input)
                }
            }]
        })
    );

    server.tool(
        CAPPT_TOOLS.GENERATE_PRESENTATION,
        `Generate presentation based on the outline generated by \`${CAPPT_TOOLS.GENERATE_OUTLINE}\``,
        {
            outline: z.string().describe(`A standard outline generated by \`${CAPPT_TOOLS.GENERATE_OUTLINE}\``),
            include_gallery: z.boolean().optional().describe('Include gallery in the generation result')
        },
        async ({outline, include_gallery}) => {
            const response = await fetch(`${cappt_url}/ppt`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cappt_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({'outline': outline, 'includeGallery': include_gallery}),
            });
            const result = await response.json();
            const data = GeneratePresentationResponse.parse(result);
            const code = data.code;
            const body = data.data;
            const text = code != 200
                ? `Failed to generate presentation: ${JSON.stringify(data)}`
                : JSON.stringify(body);
            return {
                content: [{type: 'text', text: text}]
            };
        }
    )

    return server;
}

async function main() {
    const program = new Command();
    program.addOption(new Option('--cappt-url <url>', 'Cappt API base URL').env('CAPPT_URL').default(CAPPT_BASE_URL))
        .addOption(new Option('--cappt-token <token>', 'Cappt API token').env('CAPPT_TOKEN'))
        .addOption(new Option('--transport <method>', 'Transport method').choices(['stdio', 'sse']).env('TRANSPORT').default('stdio'))
        .addOption(new Option('--sse-host <host>', 'SSE server host').env('SSE_HOST').default('0.0.0.0'))
        .addOption(new Option('--sse-port <port>', 'SSE server port').env('SSE_PORT').default(8000));
    program.parse(process.argv);
    const options = program.opts();
    const server = serve(options.capptUrl, options.capptToken);
    if (options.transport === 'stdio') {
        const transport = new StdioServerTransport();
        await server.connect(transport);
    } else if (options.transport === 'sse') {
        const app = express();
        const transports: { [sessionId: string]: SSEServerTransport } = {};
        app.get("/sse", async (_: Request, res: Response) => {
            const transport = new SSEServerTransport('/messages', res);
            transports[transport.sessionId] = transport;
            res.on("close", () => {
                delete transports[transport.sessionId];
            });
            await server.connect(transport);
        });
        app.post("/messages", async (req: Request, res: Response) => {
            const sessionId = req.query.sessionId as string;
            const transport = transports[sessionId];
            if (transport) {
                await transport.handlePostMessage(req, res);
            } else {
                res.status(400).send('No transport found for sessionId');
            }
        });
        app.listen(options.ssePort, options.sseHost);
    } else {
        throw new Error(`Unsupported transport method: ${options.transport}`);
    }
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});

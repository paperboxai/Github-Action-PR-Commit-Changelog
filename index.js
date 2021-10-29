const { Octokit } = require("@octokit/rest");
const core = require("@actions/core");
const updateSection = require("update-section");
const { Context } = require("@actions/github/lib/context");
const { isTargetEvent } = require("@technote-space/filter-github-action");

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getRegExp = (value) => new RegExp(escapeRegExp(value));

const START =
  "<!-- START pr-commits   please keep comment here to allow auto update -->";
const END =
  "<!-- END pr-commits   please keep comment here to allow auto update -->";
const MATCH_START = getRegExp("<!-- START pr-commits ");
const MATCH_END = getRegExp("<!-- END pr-commits ");

const TARGET_EVENTS = {
  pull_request: ["opened", "reopened", "synchronize", "rerequested"],
};

const matchesStart = (line) => MATCH_START.test(line);
const matchesEnd = (line) => MATCH_END.test(line);
const transform = (content, template) => {
  const info = updateSection.parse(
    content.split("\n"),
    matchesStart,
    matchesEnd
  );
  if (!info.hasStart) {
    return `${content}\n${START}\n${template}\n${END}`;
  }

  return updateSection(
    content,
    `${START}\n${template}\n${END}`,
    matchesStart,
    matchesEnd
  );
};

async function execute(context) {
  const inputs = {
    githubToken: core.getInput("github_token", { required: true }),
    prBody: core.getInput("pr_body"),
  };

  let prBody = context.payload.pull_request.body;
  if (prBody == undefined || prBody == null) {
    prBody = "";
  }
  const octokit = new Octokit({ auth: inputs.githubToken });

  const { data } = await octokit.rest.pulls.listCommits({
    ...context.repo,
    pull_number: context.payload.number,
  });

  changelog = data
    .filter(
      (commit) => !/^Merge pull request #\d+ /.test(commit.commit.message)
    )
    .map((commit) => {
      commitMsg = commit.commit.message.replace("@", "\\@");
      if(commit.author == undefined || commit.author == null){
        return `* ${commitMsg} \\@External (${commit.sha})`;
      }
      return `* ${commitMsg} @${commit.author.login} (${commit.sha})`;
    })
    .join("\n");

  template = `
### Commits\n
${changelog}
`;

  const newBody = transform(prBody, template);

  if (newBody != prBody) {
    await octokit.rest.pulls.update({
      ...context.repo,
      pull_number: context.payload.number,
      body: newBody,
    });
  }
}

const run = async () => {
  const context = new Context();

  if (!isTargetEvent(TARGET_EVENTS, context)) {
    logger.info("This is not target event.");
    return;
  }

  await execute(context);
};
run();

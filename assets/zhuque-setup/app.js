const card = document.querySelector(".setup-card");
const keyInput = document.querySelector("#api-key");
const saveButton = document.querySelector("#save-key");
const status = document.querySelector("#status");
const badge = document.querySelector("#connection-state");

function show(message, state, stateLabel) {
  status.textContent = message;
  status.dataset.state = state;
  badge.textContent = stateLabel ?? (state === "error" ? "需检查" : "未配置");
  badge.dataset.state = state;
}

async function refresh() {
  try {
    const response = await fetch("/api/status", { cache: "no-store" });
    if (!response.ok) throw new Error("status unavailable");
    const result = await response.json();
    if (!result.configured) {
      show("尚未保存密钥。", "missing");
    } else if (result.source === "environment") {
      show("当前进程已有 ZHUQUE_API_KEY；API 有效性尚未验证。", "configured", "环境变量已配置");
    } else {
      show("密钥已保存在当前用户的本机配置；API 有效性尚未验证。", "configured", "已保存在本机");
    }
  } catch {
    show("无法读取本机配置状态，请重新打开设置页。", "error");
  }
}

async function saveKey() {
  const apiKey = keyInput.value.trim();
  if (!apiKey) {
    show("请先粘贴 API Key。", "error");
    keyInput.focus();
    return;
  }
  saveButton.disabled = true;
  try {
    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken: card.dataset.csrf, apiKey })
    });
    keyInput.value = "";
    if (!response.ok) throw new Error("save failed");
    const result = await response.json();
    show(result.source === "environment"
      ? "已保存到本机；当前进程环境变量仍优先，API 有效性尚未验证。"
      : "保存成功。API 有效性尚未验证；现在可以关闭此页。", "configured",
    result.source === "environment" ? "环境变量已配置" : "已保存在本机");
  } catch {
    keyInput.value = "";
    show("保存失败。请检查本机配置权限后重试。", "error");
  } finally {
    saveButton.disabled = false;
  }
}

saveButton.addEventListener("click", saveKey);
keyInput.addEventListener("keydown", event => {
  if (event.key === "Enter") void saveKey();
});
void refresh();

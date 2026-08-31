(() => {
  const page = document.querySelector("[data-business-card]");
  const shareButton = document.querySelector("[data-share-card]");
  const copyButton = document.querySelector("[data-copy-card]");
  const status = document.querySelector("[data-card-status][aria-live]");

  if (!page || !status) return;

  const announce = (message) => {
    status.textContent = message;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      announce("名片連結已複製");
    } catch {
      announce("無法自動複製，請從瀏覽器網址列複製連結");
    }
  };

  copyButton?.addEventListener("click", copyLink);

  shareButton?.addEventListener("click", async () => {
    if (!navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: document.title,
        text: page.dataset.shareText || "BLAKE 黃大成電子名片",
        url: window.location.href,
      });
      announce("名片分享完成");
    } catch (error) {
      if (error?.name !== "AbortError") announce("分享未完成，請再試一次");
    }
  });
})();

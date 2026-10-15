# zh-hant (Traditional Chinese, Taiwan) terminology glossary

This glossary is for anyone, human or AI, who translates or reviews
`pkg/locales/l10n/zh-hant.yaml`. It applies on top of the general rules in
`.github/workflows/shared/translation-rules.md`.

`zh-hant` in this repository means Traditional Chinese **as used in Taiwan**.
Do not produce it by converting Simplified Chinese (`zh-hans`) characters:
the vocabulary differs, not just the script. Terms follow the Taiwan
localizations of Microsoft (learn.microsoft.com/zh-tw), AWS (docs.aws.amazon.com/zh_tw)
and Google Cloud (hl=zh-TW), which is what Taiwan IT users read every day.

## 1. Banned Mainland China terms

None of these may appear in any value. Use the right-hand column instead.

| Do not use (Mainland) | Use (Taiwan) |
|---|---|
| 集群 | 叢集 |
| 鏡像 | 映像檔 |
| 默認 | 預設 |
| 支持 | 支援 (rephrase when it means "hold up") |
| 網絡 | 網路 |
| 內存 | 記憶體 |
| 服務器 | 伺服器 |
| 賬號、賬戶、帳戶名 | 帳號 |
| 信息 | 資訊、訊息 |
| 軟件 | 軟體 |
| 硬件 | 硬體 |
| 文件夾 | 資料夾 |
| 文檔 | 文件 |
| 數據 | 資料 |
| 數據庫 | 資料庫 |
| 視頻 | 影片 |
| 屏幕 | 螢幕 |
| 刷新 | 重新整理 |
| 創建 | 建立 |
| 菜單 | 選單 |
| 鏈接 | 連結 |
| 端口 | 連接埠 |
| 域名 | 網域名稱 |
| 調度 | 排程 |
| 擴容 | 擴充 |
| 回滾 | 回復 |
| 插件 | 外掛 |
| 字段 | 欄位 |
| 存儲 | 儲存 |
| 負載均衡 | 負載平衡 |
| 接口 | 介面 |
| 緩存 | 快取 |
| 隊列 | 佇列 |
| 線程 | 執行緒 |
| 硬盤、磁盤 | 磁碟 |
| 激活 | 啟用 |
| 搜索 | 搜尋 |
| 優化 | 最佳化 |
| 質量 | 品質 |
| 模板 | 範本 |
| 導入 | 匯入 |
| 導出 | 匯出 |
| 異步 | 非同步 |
| 兼容 | 相容 |
| 集成 | 整合 |
| 用戶 | 使用者 |
| 證書 | 憑證 |
| 令牌 | token |
| 標簽 | 標籤 |
| 運行 | 執行 |
| 實例 | 執行個體 |
| 默認值 | 預設值 |
| 選中 | 選取 |
| 保存 | 儲存 |
| 互聯網 | 網際網路 |
| 消息 | 訊息 |
| 准入 | 許可 (Pod 安全性許可, 許可控制器) |
| 拉取 | 提取 (映像檔提取) |
| 權能 | 功能 (Linux 功能（Capabilities）) |
| 鏡射 | 鏡像站 (registry mirror) |

## 2. Allowed words that contain a banned string

These are correct Taiwan terms that happen to contain a banned string from
section 1. A checker should mask them before scanning. A banned string on its
own is still banned: for example 鏡像站 (registry mirror) is allowed, but 鏡像
alone is not (image is always 映像檔).

| Correct Taiwan term | Contains banned string | Note |
|---|---|---|
| 叢集群組、叢集成員 | 集群、集成 |  |
| 網域名稱 | 域名 |  |
| 用戶端、租用戶 | 用戶 |  |
| 鏡像站 | 鏡像 | Registry mirror only. 鏡像 on its own is still banned (image is always 映像檔) |

## 3. Layout

- Put a half-width space between Chinese and English, digits or placeholders,
  for example `3 個 Pod`, `啟用 Fleet`, `刪除 {type}`.
- Do not put a space between two Chinese characters
  (`選取多個叢集群組`, not `選取多個 叢集群組`).
- Use full-width punctuation (，。：！？（）「」). Do not use 「；」.
- Address the user as 您, never 你.
- Write "cannot start/end with X" validation messages as `不可以用.開頭`, `不可以用-結尾`, `不可以用數字開頭`.

## 4. Fixed translations

| English | zh-hant | Note |
|---|---|---|
| Cluster | 叢集 |  |
| Node | 節點 |  |
| Node pool | 節點池 | Chosen over 節點集區 (AKS, GKE) for brevity |
| Machine pool | 機器池 | Consistent with Node pool |
| Workload | 工作負載 |  |
| Project | 專案 | The Rancher Project |
| Namespace | 命名空間 | May stay as Namespace when it is a resource type title |
| Image | 映像檔 |  |
| Registry | 映像檔倉庫 |  |
| Repository | 儲存庫 |  |
| App、Apps | 應用程式 |  |
| Marketplace | 應用市集 |  |
| Chart | Chart | Helm chart stays in English |
| Extension | 擴充套件 |  |
| Continuous Delivery | 持續交付 | Fleet UI name |
| Cluster Management | 叢集管理 |  |
| Global Settings | 全域設定 |  |
| Users & Authentication | 使用者與驗證 |  |
| Authentication | 驗證 |  |
| Authorization | 授權 |  |
| Auth provider | 驗證提供者 |  |
| Role | 角色 |  |
| Permission | 權限 |  |
| Member | 成員 |  |
| Owner | 擁有者 |  |
| Token | token | Stays in English (Microsoft and Google UIs use 權杖) |
| API Key | API 金鑰 |  |
| Key (encryption) | 金鑰 |  |
| Certificate | 憑證 |  |
| Password | 密碼 |  |
| Account | 帳號 |  |
| Login／Log out | 登入／登出 |  |
| Preferences | 偏好設定 |  |
| Settings | 設定 |  |
| Configuration | 設定 (general), 組態 (config file) |  |
| Default | 預設 |  |
| Advanced | 進階 |  |
| Optional | 選用 |  |
| Required | 必填 |  |
| Enable／Disable | 啟用／停用 |  |
| Create／Edit／Delete | 建立／編輯／刪除 |  |
| Save／Cancel／Apply | 儲存／取消／套用 |  |
| Import／Export | 匯入／匯出 |  |
| Download／Upload | 下載／上傳 |  |
| Clone | 複製 |  |
| Filter／Search | 篩選／搜尋 |  |
| Refresh | 重新整理 |  |
| View | 檢視 |  |
| Detail | 詳細資料 |  |
| Status、State | 狀態 |  |
| Active | 作用中 |  |
| Running | 執行中 |  |
| Ready | 就緒 |  |
| Unavailable | 無法使用 |  |
| Healthy／Unhealthy | 健康／異常 |  |
| Error／Warning | 錯誤／警告 |  |
| Event | 事件 |  |
| Alert | 告警 |  |
| Monitoring | 監控 |  |
| Logging、Log | 日誌 |  |
| Dashboard | 儀表板 |  |
| Backup／Restore | 備份／還原 |  |
| Snapshot | 快照 |  |
| Rollback | 回復 |  |
| Policy | 政策 | EKS, GKE: 網路政策 |
| Registry mirror | 鏡像站 | Google Artifact Registry |
| Retention | 保留期間 |  |
| Admission | 許可 | Pod 安全性許可, 許可控制器 (AKS, GKE) |
| Image pull | 提取 | 映像檔提取 Secret (ACR, GKE) |
| Container Runtime | 容器執行階段 |  |
| Capabilities (Linux) | Linux 功能（Capabilities） |  |
| Controller Manager | 控制器管理員 | EKS, AKS. Taiwan software tools are called 管理員 (工作管理員, 裝置管理員) |
| Cluster Explorer | 叢集總管 | As in 檔案總管 (File Explorer) |
| Argument | 參數 | Not 引數 |
| Existing | 既有 | Not 現有 |
| Subset (Istio) | 子集合 | |
| Checksum | Checksum | Stays in English, as Taiwan IT users say it |
| Dry Run | 模擬執行 |  |
| Volume Handle | 磁碟區識別碼（Volume Handle） |  |
| Release (Helm) | Release | Stays in English, like Chart |
| Credential | 認證資訊 | Distinct from Certificate (憑證) |
| Provision | 佈建 |  |
| Client／Client Secret | 用戶端／用戶端密碼 |  |
| Tenant | 租用戶 |  |
| Session | 工作階段 |  |
| Metadata | 中繼資料 |  |
| Tag (version) | 標記 | Distinct from Label (標籤) |
| Commit | commit | Stays in English |
| Upgrade | 升級 |  |
| Drain | 排空 | GKE |
| Cordon／Uncordon | 封鎖／解除封鎖 | GKE, AKS |
| Scale | 擴縮 |  |
| Autoscaler | 自動擴縮器 |  |
| Replica | 副本 |  |
| Taint／Toleration | 污點／容忍 |  |
| Affinity | 親和性 |  |
| Label／Annotation | 標籤／註解 |  |
| Selector | 選擇器 |  |
| Probe | 探針 |  |
| Health check | 健康檢查 |  |
| Request (container resources) | 要求量 | AKS, GKE: 要求和限制. Use 要求 in sentences |
| Limit (container resources) | 限制 | Container resource limits only. Other limits (file size, retries, quotas) stay 上限 |
| Reservation | 保留量 |  |
| Quota | 配額 |  |
| Storage | 儲存 |  |
| Volume | 磁碟區 |  |
| Mount | 掛載 |  |
| Capacity | 容量 |  |
| Access mode | 存取模式 |  |
| Load balancer | 負載平衡器 |  |
| Port | 連接埠 |  |
| Protocol | 協定 |  |
| Address | 位址 |  |
| Hostname | 主機名稱 |  |
| Domain | 網域 |  |
| Template | 範本 |  |
| Catalog | 目錄 |  |
| Resource | 資源 |  |

## 5. Keep in English

Values made only of the items below may stay identical to English.

- Product and service names stay in English even when a vendor has a localized name, for example Azure Disk, Azure File, Azure Storage, Google Persistent Disk, Kinesis Stream, Alibaba ACK, Huawei CCE, Tencent TKE.
- Product and project names: Rancher、Rancher Prime、SUSE、Fleet、Helm、RKE2、K3s、Longhorn、Harvester、SUSE Virtualization、SUSE Storage、SUSE Security、NeuVector、SUSE Observability、Istio、Prometheus、Grafana、Alertmanager、Calico、Canal、Cilium、Flannel、Keycloak、Okta、GitHub、GitLab, etc.
- Kubernetes resource types (when used as the type name): Pod、Deployment、StatefulSet、DaemonSet、ReplicaSet、Job、CronJob、Service、Ingress、ConfigMap、Secret、PersistentVolume、PersistentVolumeClaim、StorageClass、CustomResourceDefinition、HorizontalPodAutoscaler、NetworkPolicy。
- Field names and type values: Max Surge、Max Unavailable、Opaque、Hand Size、Checksum, and the image pull policy values Always／IfNotPresent／Never.
- Abbreviations and units: CPU、GPU、API、URL、DNS、TLS、SSL、HTTP、HTTPS、TCP、UDP、IP、CIDR、YAML、JSON、RBAC、OIDC、SAML、LDAP、S3、SSH、MiB、GiB、KiB、milli CPU, etc.

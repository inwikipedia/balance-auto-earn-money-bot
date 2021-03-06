＃余額自動賺錢機器人

-Vultr
-電報

＃＃ 介紹

平衡機器人（BB）使平衡加密貨幣組合的投資變得容易。它會連續檢查最新的硬幣價格，並根據硬幣數量進行調整，以保持投資組合的平衡。 BB可以做到全天候24/7全自動化，或者您可以選擇在需要重新平衡某些硬幣時手動觸發交易。

BB應用程序是免費提供的。它可以本地安裝在PC，雲，Raspberry Pi，功能強大的NAS等上。

##免責聲明

使用BB應用程序的風險完全由您自己承擔，並且BB的開發人員對使用BB可能引起的任何問題概不負責。作為用戶，您有責任檢查一切是否按預期工作，如果出現問題，則停止應用程序。

投資加密貨幣並進行交易是有風險的。您可能會浪費您的錢。切勿投資無法承受的資金。

不能保證使用BB會帶來積極的結果。

通過使用BB，您承認並接受以上所有內容。

BB應用程序已獲得MIT許可。有關更多詳細信息，請參閱軟件隨附的LICENSE.txt文件。

＃＃ 在你開始之前

要使用BB，您需要一個交易平臺帳戶，在該平臺上您可以通過購買加密貨幣來創建自己的加密貨幣投資組合。 BB當前僅與世界領先的加密貨幣交易平臺[Binance帳戶]（https://www.binance.com/en/register?ref=121753644）一起使用。如果您還沒有Binance帳戶，則可以使用此[link]（https://www.binance.com/en/register?ref=121753644）創建一個帳戶，並獲得10％的交易費折扣。由於BB將執行24/7的買賣訂單，因此任何折扣都是值得的。並且...通過使用鏈接，您將支持BB項目。 ：心：

為了進一步降低您的交易成本，建議在您的帳戶上保留一些BNB（Binance加密貨幣），並用它來支付交易費用。這樣，幣安將為每筆交易額外提供25％的折扣。確保在您的Binance [費用計劃]（https://www.binance.com/en/fee/schedule）頁面上啟用了此功能。

您不必使BNB成為您的平衡投資組合的一部分，但是這樣做可能是一個好主意。這樣，您可以確保始終有足夠的BNB來支付交易費用並獲得額外的折扣。

BB執行山寨幣與比特幣（BTC）的交易。換句話說，當您的投資組合中持有過多的某種山寨幣時，它將被出售給BTC，反之亦然。因此，BTC始終需要成為您投資組合的一部分。而且，您只能將BB與可以用於BTC交易的山寨幣一起使用。但這很少是一個限制。

最後，幣安采用的最小訂單量為0.0001 BTC。因此，請確保您的投資組合總額不要太小和/或不要將其分配給太多不同的硬幣。否則，交易可能會被拒絕，很難保持您的投資組合平衡。

＃＃ 安裝

好的，接下來，讓我們從有趣的部分開始並安裝BB。安裝可能會比您慣用的技術稍微多一點，但是通過逐步進行，您應該立即啟動並運行它。

###安裝Node.js

BB是一個Web應用程序，要在您的PC上本地運行它，需要安裝Node.js。首先下載它：

-對於[Windows]（https://nodejs.org/dist/v14.16.1/node-v14.16.1-x64.msi）
-對於[macOS]（https://nodejs.org/dist/v14.16.1/node-v14.16.1.pkg）

選擇下載的軟件包，然後按照安裝步驟操作。只需接受標準設置即可。無需更改任何內容。

###安裝Balance Bot

BB帶有安裝程序，需要將其下載並存儲在您的PC上。然後，安裝程序將下載並安裝實際的BB應用程序。您將來也可以使用安裝程序以一種非常簡單的方式來安裝BB更新。

按著這些次序：

1.在此處下載BB安裝程序（https://github.com/hodlerhacks/balance/archive/refs/heads/bot.zip）
2.解壓縮文件，然後將balance-bot文件夾復制/移動到易於訪問的位置。建議使用驅動器的根目錄，因此可以在`c：\ balance-bot`中找到安裝程序。
3.打開以下程序：
   -在Windows上：命令提示符
   -在macOS上：終端
4.轉到存儲安裝程序的文件夾，例如`c：\ balance-bot`
   -在Windows上：輸入`cd \`到驅動器的根目錄。輸入`cd balance-bot`進入正確的文件夾
   -在macOS上：輸入`cd〜`進入驅動器的根目錄。輸入`cd balance-bot`進入正確的文件夾
5.輸入“ node install”啟動安裝程序。
6.等待過程完成
7. BB現在已安裝在您的系統上

做得好，困難的部分已經過去了！ 

###啟動平衡機器人

要啟動BB，請從同一文件夾（例如c：\ balance-bot`）中鍵入`node bb`。

您應該看到一條消息，提示啟動了一個新的漫遊器，後跟一個URL：http：// localhost：3001。在瀏覽器中打開此URL可以訪問Web儀表板。

就是這樣，您已經準備好開始平衡冒險！

###配置您的機器人

該應用程序將在配置屏幕上打開。您距離啟動機器人只有4個步驟：

1. **輸入您的Binance API詳細信息**。如果您從未創建過Binance API，請查看[此處]（https://www.binance.com/zh/support/faq/360002502072）以尋求幫助
2. **調整硬幣設置**。 BB使用Binance API來檢查您的交易賬戶中有哪些硬幣。所有可用硬幣將在此步驟中列出。現在，您可以選擇要從平衡中排除的硬幣。對於剩余的硬幣，您可以使用滑塊指示要與哪個分配保持平衡。默認情況下，所有硬幣將獲得均勻分布，如果您對此感到滿意，則無需在此處進行任何更改
3. **設置您的初始余額**。如果您現在才開始平衡，也可以跳過此步驟。但是，如果您已經手動或使用較舊的BB版本平衡了一段時間，則可以在此處設置初始平衡。您的初始余額代表投資組合中每種代幣的價值。此信息用於計算您的投資組合的績效，因此值得花費一些時間來正確設置此投資組合。有關如何執行此操作的更多提示，請將鼠標懸停在配置屏幕上的（i）圖標上
4. **輸入一些常規設置**。最後，給您的機器人一個名稱，並設置需要平衡硬幣的閾值。該閾值是偏離理想分布的百分比。默認設置為3％。假設您有10個硬幣，每個硬幣的目標分配率為10％，然後當實際分配高於10.3％或低於9.7％時，BB開始出售/購買硬幣。如果您在具有不同時區的服務器上在雲中運行BB，那麽您也可以在此處調整時間，因此時間戳會顯示在您的本地時間。最後，您在此處指示是要BB自動運行還是要在手動模式下使用它。建議以手動模式啟動，因此您可以確保一切都已設置並且可以按預期工作。感覺舒適後，您可以將此設置更改為自動模式，向後傾斜，讓BB來做。

###停止余額機器人

要在命令提示符或終端中停止BB，請鍵入CTRL + C / Control + C一次或幾次。

＃＃ 更新

當BB應用程序的更新可用時，將在[此處]（https://twitter.com/hodlerhacks）宣布。建議您註意這一點，以便您知道可能會發布的任何重要更新。

要安裝更新，只需打開命令提示符（Windows）或終端（macOS），進入BB文件夾（例如`c：\ balance-bot`），然後鍵入`node install`。將安裝最新版本。該過程完成後，您可以通過再次輸入`node bb`重新啟動BB。

##使用平衡機器人

BB應用程序具有許多屏幕，下面將對其進行詳細說明。

＃＃＃ 文件夾

這是主屏幕，您將在其中看到一個表格，其中包含有關投資組合和每種代幣的關鍵數據。它顯示了當前分布和目標分布。如果兩者之間的相對增量超過配置的閾值，則最後一列將顯示紅色的“出售”或綠色的“購買”指示。如果您在手動模式下使用BB，則可以在表格中選擇一行，然後確認BB應該執行命令以使硬幣恢復平衡。

該屏幕還顯示了一些關鍵的性能指標：

1.您的投資組合在BTC中的價值以及與初始余額相比的變化
2.您的投資組合價值（歐元或美元）（取決於左下角的切換），以及與初始余額相比的變化
3. BTC的凈變化和百分比。這些值是平衡效果的度量。它將投資組合的價值與如果您沒有進行任何平衡的情況下的價值進行比較，而只是在首次購買後就將您的硬幣留在原地。
4.歐元或美元的凈變化以及百分比。希望您在這裏看到正數：wink：

＃＃＃ 表現

在此屏幕上，您將找到四個圖表，這些圖表顯示了如上所述的關鍵績效指標隨時間變化的情況。

###硬幣分析

此屏幕顯示一個圖表，其中包含自開始日期以來投資組合中代幣的相對價格變化。可以快速了解哪些硬幣是您的贏家，哪些是表現不佳的。

###活動記錄

所有訂單均由BB記錄，在此屏幕上的表格中，您可以返回過去並查看訂單歷史記錄。這裏還包括可能的錯誤和其他系統警報。使用表格上方的兩個按鈕，您可以控制顯示哪些事件：訂單和/或警報。 “過濾器事件”可用於顯示包含特定文本的事件。例如，通過鍵入BNB，將顯示所有BNB交易。

###多實例

您可以使用BB並行運行多個機器人。要配置新的機器人，請打開命令提示符（Windows）或終端（macOS），進入BB文件夾（例如，“ c：\ balance-bot”），然後輸入“ node bb new”。您現有的機器人將與`node bb`一樣啟動，但是您還將看到一個新的機器人正在啟動。如果它是您的第二個機器人，它將具有ID 002，您可以通過指定的URL訪問它：http：// localhost：3002。在這裏您可以配置新的機器人。第一個bot仍可通過http：// localhost：3001獲得。這樣，您可以通過瀏覽器中的各個標簽訪問每個漫遊器，並在它們之間輕松切換。

##常見問題解答（FAQ）

#####我的投資組合中可以容納多少枚硬幣？

沒有具體限制。唯一要記住的是，Binance的最小訂購量為0.0001 BTC。因此，請確保您的投資組合總額不要太小和/或不要將其分配給太多不同的硬幣。否則，交易可能會被拒絕，很難保持您的投資組合平衡。

#####是否支持穩定硬幣和歐元？

簡短的回答：是的！ BB支持Binance上的任何... / BTC和BTC / ...對。穩定的硬幣和歐元通常沒有像山寨幣那樣的... / BTC對。但是，BB會自動使用等效的BTC / ...對來進行交易。在這種情況下，投資組合屏幕上的表格將在訂單側欄中顯示“反向”（因為通過BTC / ...對將賣出訂單反向轉換為買入訂單，反之亦然）。

#####沒有交易正在執行

如果您在PC上運行BB，請確保它沒有關閉電源，因為這顯然會停止您的機器人。

無論如何，取決於市場的走勢，尤其是您的硬幣，在幾個小時的時間內很少發生很多事情是很常見的。當然，這也很大程度上取決於您配置的閾值百分比。

如果您想知道機器人是否仍在運行，請打開Web儀表板，然後檢查右上角的狀態。它應該顯示“已連接”和最近的時間戳。

#####投資組合表多長時間刷新一次？

刷新速率為10秒。

#####我的交易工具顯示了不同的分布

交易工具通常會顯示您投資組合的分布。但是，此數據沒有像BB那樣頻繁地更新。結果，您可能會看到兩個應用程序之間的（重大）差異。如有疑問，您可能需要檢查交易工具中的實時價格信息，並將其與BB中的價格進行比較。您應該看到（幾乎）相同的價格。

#####我的BTC余額已關閉，但BB未下訂單

您的比特幣永遠不會被出售或購買。它用作其他硬幣的兌換貨幣。結果，您可能會看到超出您配置的閾值的BTC分配。沒問題，就像隨後的山寨幣交易一樣，BTC分布將自動更正。 
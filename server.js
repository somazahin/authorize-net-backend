const express = require("express");
const bodyParser = require("body-parser");
const { uuid } = require("uuidv4");
const { APIContracts, APIControllers } = require("authorizenet");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

app.post("/create-payment-token", async (req, res) => {
  const { apiLoginId, transactionKey, amount, transactionId } = req.body;

  const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
  merchantAuthenticationType.setName(apiLoginId || process.env.API_LOGIN_ID);
  merchantAuthenticationType.setTransactionKey(transactionKey || process.env.TRANSACTION_KEY);

  const transactionRequestType = new APIContracts.TransactionRequestType();
  transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHONLYTRANSACTION);
  transactionRequestType.setAmount(amount);

  const request = new APIContracts.GetHostedPaymentPageRequest();
  request.setMerchantAuthentication(merchantAuthenticationType);
  request.setTransactionRequest(transactionRequestType);

  const settings = [];

  const setting1 = new APIContracts.SettingType();
  setting1.setSettingName("hostedPaymentReturnOptions");
  setting1.setSettingValue(JSON.stringify({
    showReceipt: false,
    url: "https://www.luxury-lounger.com/thank-you",
    urlText: "Continue",
    cancelUrl: "https://www.luxury-lounger.com/payment-failed",
    cancelUrlText: "Cancel"
  }));
  settings.push(setting1);

  request.setHostedPaymentSettings({ setting: settings });

  const ctrl = new APIControllers.GetHostedPaymentPageController(request.getJSON());

  ctrl.execute(() => {
    const apiResponse = ctrl.getResponse();
    const response = new APIContracts.GetHostedPaymentPageResponse(apiResponse);

    if (response != null && response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
      const token = response.getToken();
      res.json({ token });
    } else {
      res.status(500).json({ message: response.getMessages().getMessage()[0].getText() });
    }
  });
});

app.get("/", (req, res) => {
  res.send("Authorize.Net backend is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const { FedaPay, Transaction } = require('fedapay');
FedaPay.setApiKey('sk_sandbox_test'); // Use any key
FedaPay.setEnvironment('sandbox');

(async () => {
    try {
        const transaction = await Transaction.create({
            description: "Test Depôt",
            amount: 500,
            currency: { iso: 'XOF' },
            callback_url: "http://localhost:5173"
        });
        const token = await transaction.generateToken();
        console.log("Token object generated:", token);
    } catch (e) {
        console.error("ERROR:");
        console.error(e.response ? e.response.data : e.message);
    }
})();

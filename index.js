const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const dotenv = require('dotenv');
const NodeCache = require('node-cache');
const axios = require('axios');

dotenv.config()


const app = express();
const port = 3000;

const otpCache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

// Database connection
const sequelize = new Sequelize('purchase', 'admin', 'HHepo6YA0NPfYrVkegAz', {
  host: 'hdfc-integration.cb2ymckcwftz.ap-south-1.rds.amazonaws.com',
  dialect: 'mysql'
});


// Define the Customer model
const Customer = sequelize.define('Customer', {
    customerName: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    dateOfBirth: { type: DataTypes.STRING(15), allowNull: false },
    GSTN: { type: DataTypes.STRING(15), allowNull: false },
    mobileNo: { type: DataTypes.STRING(15), allowNull: false },
    doorNo: { type: DataTypes.STRING(20), allowNull: false },
    street: { type: DataTypes.STRING(255), allowNull: false },
    area: { type: DataTypes.STRING(255), allowNull: false },
    taluk: { type: DataTypes.STRING(50), allowNull: false },
    city: { type: DataTypes.STRING(50), allowNull: false },
    pinCode: { type: DataTypes.STRING(10), allowNull: false },
    state: { type: DataTypes.STRING(50), allowNull: false },
    MaritalStatus: { type: DataTypes.STRING(10), allowNull: false },
    weddingDate: { type: DataTypes.STRING(15), allowNull: false },
    SpouseName: { type: DataTypes.STRING(255), allowNull: false },
    SpouseBirthday: { type: DataTypes.STRING(15), allowNull: false },
    FirstChildName: { type: DataTypes.STRING(255), allowNull: false },
    FirstChildBirthday: { type: DataTypes.STRING(15), allowNull: false },
    SecondChildName: { type: DataTypes.STRING(255), allowNull: false },
    SecondChildBirthday: { type: DataTypes.STRING(15), allowNull: false },
    FestivalCelebrate: { type: DataTypes.STRING(255), allowNull: false },
    CustomerType: { type: DataTypes.STRING(100), allowNull: false },
    purchase_with_sktm: {type: DataTypes.STRING(3), allowNull: false },
    chit_with_sktm: {type: DataTypes.STRING(3), allowNull: false },
    OTP: { type: DataTypes.STRING(8), allowNull: false },
    IsDeleted: { type: DataTypes.CHAR(1), allowNull: false, defaultValue: 'N' },
    CreatedDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'Customer',
    timestamps: false
  });
  
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Route for creating a new user entry
app.post('/customer', async (req, res) => {
  try {
    const data = req.body;
console.log(data);
    // Check if any required fields are missing
    const requiredFields = ['customerName', 'email', 'dateOfBirth',];
    const missingFields = requiredFields.filter(field => !data[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', missingFields });
    }

    // Generate OTP
    const otp = generateOTP(); // Assuming you have a function named generateOTP that generates a random OTP
console.log(otp)
        // Store the OTP in cache
        data.OTP = otp;
  
    // Create a new user record
    const newUser = await Customer.create(data);
    // Send SMS notification with OTP
    const phoneNumber = "+91" + (data.mobileNo || ''); 
    const referralCode = otp; // Assuming 'otp' contains the referral code
    const messageText = `Dear Customer, Thank you for your valuable time. This is your referral code: ${otp}. Please feel free to always connect with our esteemed establishment. By SKTM`;
    
    axios.get(`https://digimate.airtel.in:44111/BulkPush/DigimateCurl?loginID=Spacetext_htsi1&password=Spacetext@123&mobile=${phoneNumber}&text=${encodeURIComponent(messageText)}&senderid=SPCTXL&dlt_tm_id=1001096933494158&dlt_ct_id=1007207316134828370&dlt_pe_id=1701158071847889480&route_id=DLT_SERVICE_IMPLICT&Unicode=1&camp_name=Spacetext_ht`)
      .then(response => {
        console.log(response.data); // Log the response data
        res.status(200).json({ message: 'User created successfully and SMS sent successfully' });
      }).catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Failed to send SMS, user created successfully' });
      });
    
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route for verifying OTP
app.get('/verify_otp/:otp', async (req, res) => {
  try {
    const enterOTP = req.params.otp; // Corrected variable name to match the route parameter

    const existingUser = await Customer.findOne({ where: { OTP: enterOTP } }); // Corrected variable name in where clause
    console.log(existingUser.OTP);
    if (existingUser.OTP === enterOTP) {
      return res.status(200).json({ exists: true, mobileNo:existingUser.mobileNo });
    } else {
      return res.status(403).json({ exists: false });
    }
  } catch (error) {
    // Handle errors
    console.error('Error checking user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync models with the database and start the server
sequelize.sync()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Database synchronization error:', err);
  });

  // Function to generate OTP (Example implementation)
function generateOTP() {
  // Generate a 6-digit random number
  return Math.floor(100000 + Math.random() * 900000);
}
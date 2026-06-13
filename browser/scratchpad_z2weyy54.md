# Verification Checklist

- [ ] Open http://localhost:5173/ and wait for page load
- [ ] Select 'Al Rajhi Credit Card' in Transaction Form
- [ ] Enter '2500' in Amount
- [ ] Enter 'Credit card validation test' in Note
- [ ] Click 'Add Expense'
- [ ] Click 'Al Rajhi Credit Card' in Carousel
- [ ] Verify card displays 'Available Credit: SAR 7,500.00' and 'Spent: SAR 2,500'
- [ ] Verify purple 'Credit Statement Due' banner is displayed
- [ ] Click 'Pay Now' or 'Pay Statement' on banner
- [ ] Select 'Main Wallet' as payment source in modal
- [ ] Enter '1500' in payment amount
- [ ] Click 'Settle Credit Statement'
- [ ] Verify success animation and modal closure
- [ ] Select 'Al Rajhi Credit Card' again and verify available credit is 'SAR 9,000.00' and 'Spent: SAR 1,000'
- [ ] Select 'All Accounts Combined' to verify Net Capital updated
- [ ] Take final screenshot 'dashboard_verified'

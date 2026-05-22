import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';

class ShoppingCartScreen extends StatefulWidget {
  final Map<String, dynamic>? buyNowProduct;
  final int buyNowQuantity;

  const ShoppingCartScreen({
    super.key,
    this.buyNowProduct,
    this.buyNowQuantity = 1,
  });

  @override
  State<ShoppingCartScreen> createState() => _ShoppingCartScreenState();
}

class _ShoppingCartScreenState extends State<ShoppingCartScreen> {
  // Colors from design
  static const Color primary = Color(0xFF135bec);
  static const Color backgroundLight = Color(0xFFf6f6f8);
  static const Color slate900 = Color(0xFF0f172a);
  static const Color slate500 = Color(0xFF64748b);
  static const Color slate400 = Color(0xFF94a3b8);
  static const Color slate200 = Color(0xFFe2e8f0);
  static const Color slate100 = Color(0xFFf1f5f9);
  static const Color slate50 = Color(0xFFf8fafc);
  static const Color green600 = Color(0xFF16a34a);

  // Cart items data from design
  final List<Map<String, dynamic>> _cartItems = [
    {
      'name': 'Portable Mini Mill',
      'price': 1200.00,
      'quantity': 1,
      'image': 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4kKhdoeO83iysXA1Us6Yb2KQU-t_7JzFSAbIeaIQNqDn4N0ZC544pF4QHjUDmuTwwX7hj_3eTfg8vXtqMbj-LAKFGOZ1zjkROJkWmlF_lllVj8ue4ZdP2LCxMTvheOeS5zvQ2WP_J4tdNxXb55aSjWfSVK5fHDF8sDGw-uaZVhwE1OrmsJfgOf5XZ04Zhb7cwNNK37oJRvZ4NQAxJ0G_9Nn6i97gjI5D3EbuNTqoArbzJ27abeNbtH1AzwY_b14iP25Xao4NbYa89',
    },
    {
      'name': 'Garden Power Tiller',
      'price': 850.00,
      'quantity': 2,
      'image': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC7pHzkPGNTDXhKz1oluYbkGKwXyrhgE2TAO7nJyuqiFypYcdXYcAzAJLzcncH72zl2Je1BIz4T1liY264MoCHkv6lVr54vvBSsMSy0GerGOIqySQter5QIfBIlrTwSKrNz0NA0lH9CE2YFpBYmH71skYGJHWasP6hU7qKG0sRDphLYq-cUNsA3ZPV3U2cN9f1T1WvICx-ystdu2C8znBc2quyeYnIKkxeXikN1wqZObDCpquv_3jOzoXHfJN4NNRtx389y_W-YE2Q',
    },
    {
      'name': 'Solar Water Pump',
      'price': 450.00,
      'quantity': 1,
      'image': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAC6vQUrWMxt2OF80Llpuz5qZ0pGd4ZJ-taxSWhvGTf_Dk5Mto-jDNqYXAeCsWR2OQ6zi3XahtkybeW1k5C-OK9SgvwWXxAqpJpnTbX49Xh18f5ggUJJaPNaGBqWHFeUojjT_hl3eKRITBgyBXbWn23x-Ia-3AGVnlCP1KdgEdHIKGQeArjlqv2UcZON86ZrVLnfffcxkf8PCZQmeheCWbrP7sj7j2ULz3cXafLL_Ovk1-uNfwZ8alf99rhagUP10pkQ3Zy4A3xa_ze',
    },
  ];

  // Price calculations from design
  double get _subtotal => 3350.00;
  double get _discount => 150.00;
  double get _deliveryFee => 50.00;
  double get _grandTotal => 3250.00;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          // TopAppBar
          Container(
            color: Colors.white,
            child: SafeArea(
              bottom: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: slate100)),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 48,
                      height: 48,
                      child: Icon(Icons.arrow_back_ios, color: slate900),
                    ),
                    Expanded(
                      child: Text(
                        'Shopping Cart',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: slate900,
                          letterSpacing: -0.015 * 18,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: 48,
                      child: IconButton(
                        onPressed: () {},
                        icon: Icon(Icons.delete, color: slate900),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Scrollable Content
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 200),
              itemCount: _cartItems.length,
              itemBuilder: (context, index) {
                final item = _cartItems[index];
                return _buildCartItem(item, index);
              },
            ),
          ),

          // Fixed Bottom Summary & Action
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: const Border(top: BorderSide(color: slate200)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, -10),
                ),
              ],
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Price Summary',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: slate900,
                        letterSpacing: -0.015 * 18,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Price rows
                    _buildPriceRow('Subtotal', '\$${_subtotal.toStringAsFixed(2)}', slate500, slate900),
                    const SizedBox(height: 8),
                    _buildPriceRow('Discount', '-\$${_discount.toStringAsFixed(2)}', slate500, green600),
                    const SizedBox(height: 8),
                    _buildPriceRow('Delivery Fee', '\$${_deliveryFee.toStringAsFixed(2)}', slate500, slate900),
                    const SizedBox(height: 8),

                    // Divider
                    Container(
                      margin: const EdgeInsets.symmetric(vertical: 8),
                      height: 1,
                      color: slate100,
                    ),

                    // Grand Total
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Grand Total',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: slate900,
                          ),
                        ),
                        Text(
                          '\$${_grandTotal.toStringAsFixed(2)}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // CTA Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Proceed to Checkout',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.chevron_right, size: 20),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item, int index) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: slate50)),
      ),
      child: Row(
        children: [
          // Product Image
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: CachedNetworkImage(
              imageUrl: item['image'],
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                width: 80,
                height: 80,
                color: slate100,
              ),
              errorWidget: (context, url, error) => Container(
                width: 80,
                height: 80,
                color: slate100,
              ),
            ),
          ),
          const SizedBox(width: 16),

          // Product Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['name'],
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: slate900,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '\$${item['price'].toStringAsFixed(2)}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: slate500,
                  ),
                ),
              ],
            ),
          ),

          // Quantity Controls
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  if (item['quantity'] > 1) {
                    setState(() => _cartItems[index]['quantity']--);
                  }
                },
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: slate100,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '-',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: slate900,
                      ),
                    ),
                  ),
                ),
              ),
              Container(
                width: 32,
                alignment: Alignment.center,
                child: Text(
                  '${item['quantity']}',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: slate900,
                  ),
                ),
              ),
              GestureDetector(
                onTap: () {
                  setState(() => _cartItems[index]['quantity']++);
                },
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: slate100,
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '+',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: slate900,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, Color labelColor, Color valueColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w400,
            color: labelColor,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: valueColor,
          ),
        ),
      ],
    );
  }
}

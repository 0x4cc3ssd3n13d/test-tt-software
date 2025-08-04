// mock up data
const stockData = {
    "warehouse": {
        "WH1": {
            "laptop": {
                "price": 25000,
                "stock": 5
            },
            "mouse": {
                "price": 500,
                "stock": 10
            },
            "keyboard": {
                "price": 1000,
                "stock": 15
            }
        },
        "WH2": {
            "laptop": {
                "price": 25500,
                "stock": 8
            },
            "mouse": {
                "price": 600,
                "stock": 20
            },
            "keyboard": {
                "price": 1050,
                "stock": 25
            }
        },
        "WH3": {
            "laptop": {
                "price": 24000,
                "stock": 2
            },
            "mouse": {
                "price": 550,
                "stock": 50
            },
            "keyboard": {
                "price": 990,
                "stock": 30
            }
        }
    }
}
// ฟังชั่นสำหรับดึงข้อมูล json มาแปลงเป็นข้อมูลใน JS 
    const stock = JSON.parse(JSON.stringify(stockData.warehouse));
    let cart = [];
    let orderList = []
    let orderCount = 0;

function handleOrderSubmit(e){
    e.preventDefault();

    const product = document.getElementById('product').value;
    const qty = parseInt(document.getElementById('qty').value, 10);

    if(!product || isNaN(qty) || qty < 1) {
        alert("กรุณาเลือกสินค้าหรือระบุจำนวน")
        return;
    }

    addToCart(product, qty);
    displayOrder(product, qty);
    renderCart();
}
//--add order to cart by click on buy per time
function addToCart(product, quantity){
    const existing = cart.find(item => item.product === product);
    if(existing){
        existing.quantity += quantity;
    }else{
        cart.push({ product, quantity });
    }
    renderCart();
}
//--show order when you click
function displayOrder(product, qty){
    const output = document.getElementById("orderOutput")
    output.innerHTML = `คุณได้เพิ่ม ${product} เป็นจำนวน:${qty} ชิ้น`
}
//--show all item in cart
function renderCart() {
  const cartDiv = document.getElementById("cart_list");
  if(cart.length === 0){
    cartDiv.innerHTML = "<p>ไม่มีรายการสินค้าในคำสั่งซื้อ</p>"
  } else {
    cartDiv.innerHTML = `
      <h3>รายการตะกร้าสินค้า</h3>
      <ul>
        ${cart.map(item => `<li>${item.product} จำนวน ${item.quantity} ชิ้น</li>`).join("")}
      </ul>
    `;
  }
}
// ส่งคำสั่งซื้อ
function addOrderList() {
  document.getElementById("send_order").addEventListener("click", () => {
    if (cart.length === 0) {
      alert("ตะกร้าว่าง ไม่มีรายการให้ส่ง");
      return;
    }

    orderCount++;
    const currentCart = [...cart]; // สำรองข้อมูลตะกร้าปัจจุบันไว้ก่อนเคลียร์
    orderList.push({ id: orderCount, items: currentCart });

    // เพิ่มรายการใหม่ใน order_list
    const orderListDiv = document.getElementById("order_list");
    const orderHtml = `
      <div class="order">
        <h4>คำสั่งซื้อที่ ${orderCount}</h4>
        <ul>
          ${currentCart.map(item => `<li>${item.product} จำนวน ${item.quantity} ชิ้น</li>`).join("")}
        </ul>
        <hr>
      </div>
    `;
    orderListDiv.innerHTML += orderHtml;

    // ล้างตะกร้า
    cart = [];
    renderCart();
  });
}

function find_best_warehouse(order) {
  const selectedWarehouse = {};

  order.items.forEach(item => {
    let bestWH = null;
    let lowestPrice = Infinity;

    for (const [whName, products] of Object.entries(stock)) {
      const product = products[item.product];
      if (product && product.stock >= item.quantity && product.price < lowestPrice) {
        bestWH = whName;
        lowestPrice = product.price;
      }
    }

    if (bestWH) {
      selectedWarehouse[item.product] = bestWH;
    } else {
      selectedWarehouse[item.product] = null; // สินค้าไม่พอ
    }
  });

  return selectedWarehouse;
}

function process_order(order, allocation) {
  const unfulfilled = [];

  order.items.forEach(item => {
    const wh = allocation[item.product];
    if (wh && stock[wh][item.product].stock >= item.quantity) {
      stock[wh][item.product].stock -= item.quantity;
      console.log(`📦 ตัดสต๊อกจาก ${wh} สำหรับ ${item.product} จำนวน ${item.quantity}`);
    } else {
      unfulfilled.push(item.product);
    }
  });

  if (unfulfilled.length > 0) {
    alert(`คำสั่งซื้อ #${order.id} ไม่สามารถจัดส่งสินค้า: ${unfulfilled.join(", ")}`);
  } else {
    console.log(`✅ คำสั่งซื้อ #${order.id} จัดการเรียบร้อย`);
  }

  renderStock();
}

function consolidate_shipping(order, allocation) {
  const shippingPlan = {};

  for (const item of order.items) {
    const wh = allocation[item.product];
    if (!shippingPlan[wh]) shippingPlan[wh] = [];
    shippingPlan[wh].push(item);
  }

  console.log(`แผนรวมส่งสำหรับ Order #${order.id}:`, shippingPlan);
  return shippingPlan;
}

function handle_concurrent_orders(orderList) {
  for (const order of orderList) {
    const allocation = find_best_warehouse(order); 

    process_order(order, allocation);            
    consolidate_shipping(order, allocation);
  }

  // clear & reset
  orderList.length = 0;
  cart.length = 0;

  document.getElementById("order_list").innerHTML = "<p>ยังไม่มีคำสั่งซื้อ</p>";
  document.getElementById("cart_list").innerHTML = "<p>ไม่มีรายการสินค้าในคำสั่งซื้อ</p>";
  console.log("คำสั่งซื้อทั้งหมดเคลียร์แล้ว");
}

function renderStock(){
    const stockDiv = document.getElementById("stock_qty");
    let html = `<h3>คลังสินค้าและสต๊อกปัจจุบัน</h3>`;

    for(const [warehouse, products] of Object.entries(stock)){
        html += `<h4>${warehouse}</h4>`;
        for(const [product, detail] of Object.entries(products)){
            html += `<li>${product} ราคา: ${detail.price} บาท | คงเหลือ : ${detail.stock} ชิ้น</li>`
        }
        html += `</ul><hr>`;
    }

    stockDiv.innerHTML = html;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("orderForm").addEventListener("submit", handleOrderSubmit);
  addOrderList();
  
  //ดึงstock 
  renderStock();

    // เชื่อมปุ่มจัดการคำสั่งซื้อ
  document.getElementById("completeOrderBtn").addEventListener("click", () => {
    if (orderList.length === 0) {
      alert("ยังไม่มีคำสั่งซื้อที่ต้องจัดการ");
      return;
    }
    handle_concurrent_orders(orderList);
  });
});
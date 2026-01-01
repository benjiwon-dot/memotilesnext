
const STORAGE_KEY = 'memotiles_orders';

const SEED_FLAG = 'memotiles_seeded_v2'; // Increment version to force re-seed if needed

export const getOrders = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        let orders = data ? JSON.parse(data) : [];

        // Seed Data if never seeded or storage is empty
        const isSeeded = localStorage.getItem(SEED_FLAG);
        if (!isSeeded || orders.length === 0) {
            const seedOrders = generateSeedOrders();
            // Merge with existing if any, but usually we just replace if empty
            const finalOrders = orders.length > 0 ? [...orders] : seedOrders;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrders));
            localStorage.setItem(SEED_FLAG, 'true');
            return finalOrders;
        }

        return orders;
    } catch (error) {
        console.error('Failed to parse orders:', error);
        return [];
    }
};

const generateSeedOrders = () => {
    const statuses = ['paid', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'];
    const customers = [
        { name: "John Doe", email: "john@example.com", phone: "081-111-2222", age: 28 },
        { name: "Jane Smith", email: "jane@example.com", phone: "082-333-4444", age: 32 },
        { name: "Alice Brown", email: "alice@example.com", phone: "083-555-6666", age: 24 },
        { name: "Bob Wilson", email: "bob@example.com", phone: "084-777-8888", age: 45 },
        { name: "Charlie Davis", email: "charlie@example.com", phone: "085-999-0000", age: 38 },
        { name: "Eve Miller", email: "eve@example.com", phone: "086-123-4567", age: 29 },
        { name: "Frank Garcia", email: "frank@example.com", phone: "087-234-5678", age: 52 },
        { name: "Grace Lee", email: "grace@example.com", phone: "088-345-6789", age: 31 },
        { name: "Henry Chen", email: "henry@example.com", phone: "089-456-7890", age: 27 },
        { name: "Ivy Wang", email: "ivy@example.com", phone: "090-567-8901", age: 33 }
    ];

    const seedData = [];
    for (let i = 1; i <= 20; i++) {
        const customer = customers[i % customers.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const tileCount = 3 + (i % 5);

        seedData.push({
            id: `ORD-SEED-${String(i).padStart(3, '0')}`,
            createdAt: new Date(Date.now() - (i * 3600000 * 4)).toISOString(), // Spread out over time
            status: status,
            items: Array(tileCount).fill(0).map((_, idx) => ({
                id: `img-${i}-${idx}`,
                url: null, // Seeds usually won't have real URLs in this demo
                filename: `tile-${idx + 1}.jpg`,
                filter: 'Original'
            })),
            qty: tileCount,
            total: tileCount * 200,
            currency: '฿',
            shipping: {
                name: customer.name,
                address: `${100 + i} Soi Sukhumvit`,
                city: "Bangkok",
                postalCode: "10110",
                country: "Thailand",
                phone: customer.phone,
                email: customer.email,
                age: customer.age
            },
            meta: { seed: true }
        });
    }
    return seedData;
};

export const saveOrders = (orders) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event('storage')); // Trigger update for same-window sync
};

export const createOrder = ({ items, total, currency = '฿', shipping }) => {
    const existingOrders = getOrders();
    const newOrder = {
        id: `ORD-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'paid', // Initial status
        items,
        qty: items.length,
        total,
        currency,
        shipping
    };

    // Add to beginning of list
    const updatedOrders = [newOrder, ...existingOrders];
    saveOrders(updatedOrders);
    return newOrder;
};

export const updateOrderStatus = (orderId, status) => {
    const allowedStatuses = ['paid', 'processing', 'printed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status.toLowerCase())) {
        console.error(`Invalid status: ${status}`);
        return null;
    }

    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    orders[index] = { ...orders[index], status: status };
    saveOrders(orders);
    return orders[index];
};

export const canEdit = (order) => {
    // Can only edit if Paid or Processing. 
    // Once Printed/Shipped/Delivered/Cancelled, it's locked.
    const editableStatuses = ['paid', 'processing'];
    return editableStatuses.includes(order.status.toLowerCase());
};

export const cancelOrder = (orderId) => {
    const orders = getOrders();
    const order = orders.find(o => o.id === orderId);

    if (!order || !canEdit(order)) return false;

    return updateOrderStatus(orderId, 'cancelled');
};

export const updateOrderItems = (orderId, items) => {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);

    if (index === -1) return false;
    if (!canEdit(orders[index])) return false;

    orders[index] = {
        ...orders[index],
        items,
        qty: items.length,
        // Recalculate total if pricing is simple (200 per tile)
        total: items.length * 200
    };

    saveOrders(orders);
    return orders[index];
};

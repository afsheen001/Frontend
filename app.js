// Final frontend application logic handling cart, search, sorting, and checkout

// Create a new Vue instance
new Vue({
  // Connect Vue to the HTML element with id="app"
  el: '#app',

  // DATA (Reactive State)

  data: {
    // UI control flags
    showCart: false,          // Show / hide cart section
    showCheckoutForm: false,  // Show / hide checkout form
    showInfoModal: false,     // Show / hide lesson info modal

    // Search & sorting
    searchTerm: '',           // Text entered in search box
    sortBy: '',               // Attribute to sort by (price, subject, seats, etc.)
    sortOrder: 'asc',         // Sorting order: asc or desc

    // Main data storage
    lessons: [],              // Lessons fetched from backend
    cart: [],                 // Selected lessons added to cart

    // Customer checkout details
    customer: { 
      name: '', 
      email: '', 
      phone: '' 
    },

    // Selected lesson for modal view
    selectedClass: {}
  },

   
  mounted() {
    // Called automatically when the page loads
    // Fetch lessons from backend API
    this.fetchLessons();
  },

  
  // COMPUTED PROPERTIES ((Auto-updated calculated values)) //
    
  computed: {

    // Calculate total cart price dynamically
    totalPrice() {
      return 'AED ' + this.cart.reduce(
        (sum, item) =>
          sum + parseInt(item.price.replace('AED ', '')),
        0
      );
    },

    // Apply search filtering and sorting to lessons
    filteredClasses() {
      const term = this.searchTerm.toLowerCase();

      // Filter lessons based on search term
      let result = this.lessons.filter(cls =>
        cls.subject.toLowerCase().includes(term) ||
        cls.location.toLowerCase().includes(term) ||
        (cls.features || '').toLowerCase().includes(term) ||
        cls.price.toLowerCase().includes(term)
      );

      // Sort lessons if a sorting option is selected
      if (this.sortBy) {
        result.sort((a, b) => {
          let A = a[this.sortBy];
          let B = b[this.sortBy];

          // Numeric sorting for price
          if (this.sortBy === 'price') {
            A = parseInt(A.replace('AED ', ''));
            B = parseInt(B.replace('AED ', ''));
          }
          // Numeric sorting for seats
          else if (this.sortBy === 'seats') {
            A = Number(A);
            B = Number(B);
          }
          // Text sorting for subject or location
          else {
            A = A.toLowerCase();
            B = B.toLowerCase();
            return this.sortOrder === 'asc'
              ? A.localeCompare(B)
              : B.localeCompare(A);
          }

          return this.sortOrder === 'asc' ? A - B : B - A;
        });
      }

      return result;
    }
  },

  // ---------------------------
  // METHODS
  // ---------------------------
  methods: {

    // Fetch lessons from backend API
    async fetchLessons() {
      const res = await fetch('https://backend-gq5t.onrender.com/lessons');
      this.lessons = await res.json();
    },

    // Toggle between ascending and descending sorting
    toggleSort() {
      if (!this.sortBy) return alert('Select sort option');
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    },

    // Highlight searched text in lesson details
    highlightText(text) {
      if (!this.searchTerm) return text;
      return text.replace(
        new RegExp(`(${this.searchTerm})`, 'gi'),
        '<mark>$1</mark>'
      );
    },

    // Add lesson to cart and reduce available seats
    addToCart(cls) {
      if (cls.seats <= 0) return;

      this.cart.push({
        _id: cls._id,
        subject: cls.subject,
        price: cls.price,
        image: cls.image
      });

      cls.seats -= 1;
      this.showCart = true;
    },

    // Remove lesson from cart and restore seat count
    removeFromCart(index) {
      const item = this.cart[index];
      const lesson = this.lessons.find(l => l._id === item._id);

      if (lesson) lesson.seats += 1;

      this.cart.splice(index, 1);
      if (!this.cart.length) this.showCart = false;
    },

    // Show or hide cart
    toggleCart() {
      this.showCart = !this.showCart;
    },

    // Open checkout form
    openCheckoutForm() {
      if (!this.cart.length) return alert('Cart empty');
      this.showCheckoutForm = true;
    },

    // Close checkout form
    closeCheckoutForm() {
      this.showCheckoutForm = false;
    },

    // Allow only numbers in phone input
    validatePhoneInput() {
      this.customer.phone = this.customer.phone.replace(/\D/g, '');
    },

    // Validate email format using regex
    validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    // Confirm checkout and send order to backend
    async confirmCheckout() {
      if (!this.customer.name || !this.customer.phone)
        return alert('Missing details');

      if (!this.validateEmail(this.customer.email))
        return alert('Invalid email');

      await fetch('https://backend-gq5t.onrender.com/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: this.customer,
          items: this.cart
        })
      });

      alert(`Booking confirmed!\nTotal: ${this.totalPrice}`);

      // Reset application state
      this.cart = [];
      this.customer = { name: '', email: '', phone: '' };
      this.showCheckoutForm = false;
      this.showCart = false;

      // Reload lessons to update seats
      this.fetchLessons();
    },

    // Open lesson info modal
    openClassInfo(cls) {
      this.selectedClass = cls;
      this.showInfoModal = true;
    },

    // Close lesson info modal
    closeClassInfo() {
      this.showInfoModal = false;
    }
  }
});

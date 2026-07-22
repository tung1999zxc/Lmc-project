import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// 🎯 Gọi API lấy dữ liệu
export const fetchEmployees = createAsyncThunk("data/fetchEmployees", async () => {
  const response = await fetch("/api/employees");
  const payload = await response.json();
  return {
    ...payload,
    data: (payload.data || []).map((employee) => ({
      ...employee,
      quocgia: employee.quocgia || "kr",
    })),
  };
});

export const fetchProducts = createAsyncThunk("data/fetchProducts", async () => {
  const response = await fetch("/api/products");
  return response.json();
});

export const fetchOrders = createAsyncThunk("data/fetchOrders", async () => {
  const response = await fetch("/api/orders");
  return response.json();
});

export const fetchRecordsMKT = createAsyncThunk("data/fetchRecordsMKT", async () => {
  const response = await fetch("/api/recordsMKT");
  return response.json();
});

export const fetchPageName = createAsyncThunk("data/fetchPageName", async () => {
  const response = await fetch("/api/pageName");
  return response.json();
});

// 🏗️ Khởi tạo slice Redux
const dataSlice = createSlice({
  name: "data",
  initialState: {
    employees: [],
    products: [],
    orders: [],
    recordsMKT: [],
    pageName: [],
    pageName2: [],
    loading: {
      employees: false,
      products: false,
      orders: false,
      recordsMKT: false,
      pageName: false,
    },
    error: {
      employees: null,
      products: null,
      orders: null,
      recordsMKT: null,
      pageName: null,
    },
  },
  reducers: { setPageName2: (state, action) => {
      state.pageName2 = action.payload; // Cập nhật stages từ payload
    },},
  extraReducers: (builder) => {
    builder
      // Xử lý employees
      .addCase(fetchEmployees.pending, (state) => {
        state.loading.employees = true;
        state.error.employees = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading.employees = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading.employees = false;
        state.error.employees = action.error.message;
      })
      
      // Xử lý products
      .addCase(fetchProducts.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.products = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.error.message;
      })
      
      // Xử lý orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.error.message;
      })
      
      // Xử lý recordsMKT
      .addCase(fetchRecordsMKT.pending, (state) => {
        state.loading.recordsMKT = true;
        state.error.recordsMKT = null;
      })
      .addCase(fetchRecordsMKT.fulfilled, (state, action) => {
        state.loading.recordsMKT = false;
        state.recordsMKT = action.payload;
      })
      .addCase(fetchRecordsMKT.rejected, (state, action) => {
        state.loading.recordsMKT = false;
        state.error.recordsMKT = action.error.message;
      })
      
      // Xử lý pageName
      .addCase(fetchPageName.pending, (state) => {
        state.loading.pageName = true;
        state.error.pageName = null;
      })
      .addCase(fetchPageName.fulfilled, (state, action) => {
        state.loading.pageName = false;
        state.pageName = action.payload;
      })
      .addCase(fetchPageName.rejected, (state, action) => {
        state.loading.pageName = false;
        state.error.pageName = action.error.message;
      });
  },
});

// 📌 Export reducer
export default dataSlice.reducer;

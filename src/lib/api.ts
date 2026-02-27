const API_BASE_URL = "https://ngrchatbot.whindia.in/fpda";

export interface ApiResponse {
  status: string;
  message: string;
  data?: any;
}

export interface UserSession {
  user_name: string;
  user_code: string;
  role_selection: string;
}

// Helper to extract a user-friendly error message
export const getApiErrorMessage = (error: unknown): string => {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Unable to connect to server. Please check your internet connection.";
  }
  if (error instanceof Error) {
    // HTTP status-based messages
    if (error.message.includes("status: 400")) return "Invalid request. Please check the data and try again.";
    if (error.message.includes("status: 401")) return "Session expired. Please log in again.";
    if (error.message.includes("status: 403")) return "You do not have permission to perform this action.";
    if (error.message.includes("status: 404")) return "The requested resource was not found.";
    if (error.message.includes("status: 409")) return "This record already exists or conflicts with existing data.";
    if (error.message.includes("status: 422")) return "Invalid data submitted. Please review and correct the fields.";
    if (error.message.includes("status: 429")) return "Too many requests. Please wait a moment and try again.";
    if (error.message.includes("status: 500")) return "Server error. Please try again later.";
    if (error.message.includes("status: 502")) return "Server is temporarily unavailable. Please try again later.";
    if (error.message.includes("status: 503")) return "Service is under maintenance. Please try again later.";
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
};

// Helper to create form data from object
const createFormData = (data: Record<string, string>): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
};

// Generic POST request with form data
const postFormData = async (endpoint: string, data: Record<string, string>): Promise<ApiResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      body: createFormData(data),
    });
    
    if (!response.ok) {
      // Try to extract error message from response body
      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          throw new Error(errorBody.message);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && !parseErr.message.includes("status:")) {
          throw parseErr;
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Generic GET request
const getData = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
    });
    
    if (!response.ok) {
      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          throw new Error(errorBody.message);
        }
      } catch (parseErr) {
        if (parseErr instanceof Error && !parseErr.message.includes("status:")) {
          throw parseErr;
        }
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Auth endpoints
export const authApi = {
  register: (data: {
    user_name: string;
    user_code: string;
    user_pwd: string;
    role_selection: string;
  }) => postFormData("/users/", data),

  login: (data: { user_name: string; user_pwd: string }) =>
    postFormData("/user_login/", data),

  verifyUser: (data: { user_name: string }) =>
    postFormData("/verify_user/", data),

  updatePassword: (data: { user_code: string; new_password: string }) =>
    postFormData("/update_password/", data),
};

// Master Location endpoints
export const locationApi = {
  create: (data: {
    masjid_name: string;
    address: string;
    city: string;
    created_by: string;
  }) => postFormData("/masterlocation/", data),
  
  getAll: () => getData("/get_masterlocation/"),

  update: (data: Record<string, string>) => postFormData("/updatelocation/", data),

  delete: (data: Record<string, string>) => postFormData("/deletelocation/", data),
};

// Item Category endpoints
export const itemCategoryApi = {
  create: (data: {
    cat_name: string;
    created_by: string;
  }) => postFormData("/masteritemcategory/", data),
  
  getAll: () => getData("/get_masteritemcategory/"),

  update: (data: Record<string, string>) => postFormData("/updateitemcategory/", data),

  delete: (data: Record<string, string>) => postFormData("/deleteitemcat/", data),
};

// Unit endpoints
export const unitApi = {
  create: (data: {
    unit_name: string;
    unit_short: string;
    created_by: string;
  }) => postFormData("/masterunit/", data),
  
  getAll: () => getData("/get_masterunit/"),

  update: (data: Record<string, string>) => postFormData("/updateunit/", data),

  delete: (data: Record<string, string>) => postFormData("/deleteunit/", data),
};

// Item endpoints
export const itemApi = {
  create: (data: {
    item_name: string;
    cat_name: string;
    brand: string;
    unit_short: string;
    item_rate: string;
    remark: string;
    created_by: string;
  }) => postFormData("/masteritem/", data),
  
  getAll: () => getData("/get_masteritem/"),

  update: (data: Record<string, string>) => postFormData("/updateitem/", data),

  delete: (data: Record<string, string>) => postFormData("/deleteitem/", data),
};

// Supplier endpoints
export const supplierApi = {
  create: (data: {
    sup_name: string;
    sup_add: string;
    sup_city: string;
    sup_mobile: string;
    cat_code: string;
    cat_name: string;
    created_by: string;
  }) => postFormData("/mastersupplier/", data),
  
  getAll: () => getData("/get_mastersupplier/"),

  update: (data: Record<string, string>) => postFormData("/updatesupplier/", data),

  delete: (data: Record<string, string>) => postFormData("/deletesupplier/", data),
};

// Recipe Type endpoints
export const recipeTypeApi = {
  create: (data: {
    recipe_type: string;
    recipe_perkg: string;
    recipe_totpkt: string;
    created_by: string;
  }) => postFormData("/masterrecipttype/", data),
  
  getAll: () => getData("/get_masterrecipttype/"),

  update: (data: Record<string, string>) => postFormData("/updaterecipetype/", data),

  delete: (data: Record<string, string>) => postFormData("/deleterecipetype/", data),
};

// Category and Unit combined endpoint
export const categoryUnitApi = {
  getAll: () => getData("/get_mastercatunit/"),
};

// Recipe endpoints
export const recipeApi = {
  create: (data: {
    recipe_type: string;
    recipe_code: string;
    item_name: string;
    item_code: string;
    cat_name: string;
    cat_code: string;
    unit_short: string;
    req_qty: string;
    created_by: string;
  }) => postFormData("/masterrecipe/", data),
  
  getAll: () => getData("/get_masterrecipe/"),

  update: (data: Record<string, string>) => postFormData("/updaterecipe/", data),

  delete: (data: Record<string, string>) => postFormData("/deleterecipe/", data),
};

// Item with codes endpoint (for Recipe form)
export const itemSendApi = {
  getAll: () => getData("/get_master_item/"),
};

// Item details endpoint (for Recipe form - gets cat_code, unit_short)
export const itemDetailsApi = {
  getAll: () => getData("/get_masteritem/"),
};

// Delivery Plan Schedule endpoints
export const deliveryScheduleApi = {
  create: (data: {
    schd_date: string;
    recipe_type: string;
    recipe_code: string;
    created_by: string;
  }) => postFormData("/Deliveryplanschedule/", data),
  
  getAll: () => getData("/get_Deliveryplanschedule/"),

  update: (data: Record<string, string>) => postFormData("/updateschedule/", data),

  delete: (data: Record<string, string>) => postFormData("/deleteschedule/", data),
};

// Delivery Plan Requirement endpoints
export const deliveryRequirementApi = {
  create: (data: {
    req_date: string;
    masjid_name: string;
    masjid_code: string;
    req_qty: string;
    created_by: string;
  }) => postFormData("/Deliveryplanrequirement/", data),
  
  getAll: () => getData("/get_Deliveryplanrequirement/"),

  update: (data: Record<string, string>) => postFormData("/updaterequirement/", data),

  delete: (data: Record<string, string>) => postFormData("/deleterequirement/", data),
};

// Masjid list endpoint (for Requirement form)
export const masjidListApi = {
  getAll: () => getData("/get_masjid_list/"),
};

// Delivery Plan Requirement lookup (for auto-populating req_qty)
export const deliveryPlanReqApi = {
  getAll: () => getData("/get_Deliveryplanrequirement/"),
};

// Recipe type with codes endpoint (for Schedule form)
export const recipeTypeListApi = {
  getAll: () => getData("/get_master_recipttype/"),
};

// Day Requirements API endpoints
export const dayRequirementsApi = {
  getByDate: (date: string) => postFormData("/get_recipe_and_qty_by_date/", { date }),
  getRecipeTotpkt: (recipeType: string) => postFormData("/get_recipe_totpkt_by_type/", { recipe_type: recipeType }),
  getRecipeItems: (recipeType: string, date: string) => postFormData("/dayrequirment/", { recipe_type: recipeType, date }),
  createHeader: (data: {
    day_req_date: string;
    recipe_type: string;
    recipe_code: string;
    day_tot_req: string;
    purc_type: string;
    created_by: string;
  }) => postFormData("/requirment_hd/", data),
  createTransaction: (data: {
    purc_id: string;
    day_req_date: string;
    recipe_code: string;
    item_name: string;
    cat_name: string;
    unit_short: string;
    day_req_qty: string;
    purc_type: string;
    created_by: string;
  }) => postFormData("/requirment_tr/", data),
  getBulkList: () => getData("/get_bulk_requirement/"),
};

// Packing API endpoints
export const packingApi = {
  getAll: () => getData("/packing_get/"),
  getByDate: (date: string) => postFormData("/get_recipe_and_qty_by_date/", { date }),
  create: (data: {
    pack_date: string;
    recipe_type: string;
    req_qty: string;
    avbl_qty: string;
    pack_qty: string;
    created_by: string;
  }) => postFormData("/packing/", data),
};

// Food Allocation API endpoints
export const allocationApi = {
  getAll: () => getData("/allocation_get/"),
  getScheduleRequirement: (date: string) => postFormData("/schedule_requirement_by_date/", { date }),
  getAvailableQty: (date: string) => postFormData("/avilable_qty/", { date }),
  create: (data: {
    alloc_date: string;
    masjid_name: string;
    req_qty: string;
    avbl_qty: string;
    alloc_qty: string;
    created_by: string;
    recipe_type: string;
    recipe_code: string;
  }) => postFormData("/allocation_post/", data),
  updateAvailableQty: (data: { alloc_date: string; avbl_qty: string }) =>
    postFormData("/updateavbl_qty/", data),
  delete: (data: { alloc_date: string; masjid_name: string }) =>
    postFormData("/deleteallocation/", data),
};

// Delivery API endpoints
export const deliveryApi = {
  getAll: () => getData("/delivery_get/"),
  getScheduleRequirement: (date: string) => postFormData("/schedule_requirement_by_date/", { date }),
  create: (data: {
    location: string;
    delivery_date: string;
    delivery_qty: string;
    delivery_by: string;
    delivery_time: string;
  }) => postFormData("/delivery_post/", data),
};

// Cleaning API endpoints
export type CleaningType = "material" | "vessel" | "prep" | "pack";

const cleaningEndpoints: Record<CleaningType, string> = {
  material: "/material_clean/",
  vessel: "/vessel_clean/",
  prep: "/prep_clean/",
  pack: "/pack_clean/",
};

export const cleaningApi = {
  submit: async (type: CleaningType, formData: FormData): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}${cleaningEndpoints[type]}`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};

// Cooking API endpoints
export const cookingApi = {
  submit: async (formData: FormData): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/cooking/`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },
};

// Module Master API endpoints
export const moduleApi = {
  getAll: () => getData("/get_module/"),
  create: (data: {
    mod_name: string;
    sub_mod_name: string;
    created_by: string;
  }) => postFormData("/post_module/", data),
};

// User management API endpoints
export const userManagementApi = {
  getAll: () => getData("/get_users/"),
  delete: (data: { user_code: string }) => postFormData("/deleteuser/", data),
  mapModules: (data: {
    user_code: string;
    user_name: string;
    module_id: string;
    sub_mod_id: string;
    mod_name: string;
    sub_mod_name: string;
    created_by: string;
  }) => postFormData("/user_mapping/", data),
  getPermissions: (data: { user_code: string }) => postFormData("/get_user_permissions/", data),
};

// Media viewing API endpoints
export const mediaApi = {
  getMedia: (date: string, type: string) =>
    postFormData("/show_clean_media/", { clean_date: date, clean_type: type }),
};

// Supplier Requisition API endpoints
export const supplierRequisitionApi = {
  getItems: (data: { cat_code: string; day_req_date: string; recipe_code: string }) =>
    postFormData("/requestionsupplier/", data),
  getSuppliersByCategory: (cat_code: string) =>
    postFormData("/get_supplier_category/", { cat_code }),
};

// Bulk Day Requirements API endpoints
export const bulkItemApi = {
  getAll: (fromDate: string, toDate: string) => postFormData("/getbulkitem/", { from_date: fromDate, to_date: toDate }),
};

export const bulkRequirementApi = {
  createHeader: (data: {
    day_req_date: string;
    purc_type: string;
    created_by: string;
  }) => postFormData("/bulk_requirment_hd/", data),

  createTransaction: (data: {
    purc_id: string;
    day_req_date: string;
    recipe_code: string;
    item_name: string;
    cat_name: string;
    unit_short: string;
    day_req_qty: string;
    created_by: string;
    purc_type: string;
  }) => postFormData("/bulk_requirment_tr/", data),
};

// Material Receipt API endpoints
export const materialReceiptApi = {
  getCategories: () => getData("/get_masteritemcategory/"),
  getSuppliersByCategory: (cat_code: string) =>
    postFormData("/get_supplier_category/", { cat_code }),
  getItemsByDateAndCategory: (data: {
    day_req_date: string;
    purc_type: string;
    cat_name: string;
  }) => postFormData("/day_req_qty_materiel/", data),
  create: (data: {
    mat_rec_date: string;
    day_req_date: string;
    sup_name: string;
    cat_name: string;
    item_name: string;
    unit_short: string;
    mat_rec_qty: string;
    created_by: string;
  }) => postFormData("/save_materialreceipt/", data),
};

// Recipe Cost API endpoints
export const recipeCostApi = {
  getAll: () => getData("/get_recipe_cost/"),
  getIngredients: () => getData("/get_recipedateforcost/"),
  create: (data: {
    day_rcp_date: string;
    recipe_type: string;
    recipe_code: string;
    cat_name: string;
    cat_code: string;
    item_name: string;
    item_code: string;
    unit_short: string;
    req_qty: string;
    item_rate: string;
    total_rate: string;
    created_by: string;
  }) => postFormData("/recipe_cost/", data),
  update: (data: {
    day_rcp_date: string;
    recipe_type: string;
    recipe_code: string;
    cat_name: string;
    cat_code: string;
    item_name: string;
    item_code: string;
    unit_short: string;
    req_qty: string;
    item_rate: string;
    total_rate: string;
    created_by: string;
  }) => postFormData("/update_recipe_cost/", data),
  delete: (data: { day_rcp_date: string; recipe_type: string }) =>
    postFormData("/delete_recipe_cost/", data),
  getByDate: (data: { day_rcp_date: string }) =>
    postFormData("/get_recipe_cost_by_date/", data),
};

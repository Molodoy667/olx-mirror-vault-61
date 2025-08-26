import{u as n}from"./useQuery-DYBXd3SC.js";import{s as o}from"./index-KbJkRX07.js";const c=()=>n({queryKey:["categories"],queryFn:async()=>{const{data:i,error:r}=await o.from("categories").select(`
          *,
          listings(count)
        `).is("parent_id",null).order("order_index",{ascending:!0});if(r)throw r;return i.map(e=>{var s,t;return{...e,listing_count:((t=(s=e.listings)==null?void 0:s[0])==null?void 0:t.count)||0}})}}),g=()=>n({queryKey:["categories-with-subcategories"],queryFn:async()=>{const{data:i,error:r}=await o.from("categories").select(`
          *,
          listings(count),
          subcategories:categories!parent_id(*)
        `).is("parent_id",null).order("order_index",{ascending:!0});if(r)throw r;return i.map(e=>{var s,t;return{...e,listing_count:((t=(s=e.listings)==null?void 0:s[0])==null?void 0:t.count)||0,subcategories:e.subcategories||[]}})}});export{c as a,g as u};

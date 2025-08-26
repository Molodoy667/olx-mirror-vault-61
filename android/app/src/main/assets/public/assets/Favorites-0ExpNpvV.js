import{u as m,h as c,s as n,j as s}from"./index-KbJkRX07.js";import{u as g}from"./useQuery-DYBXd3SC.js";import{H as u,b as p}from"./Footer-CG381HwE.js";import{P as x}from"./ProductCardNew-DTAZEOFN.js";import{H as h}from"./heart-BstkNJZ-.js";import"./useAdmin-wN6CKAL8.js";import"./Combination-CN-dILO0.js";import"./badge-DpjjU75J.js";import"./index-D5jjwgwZ.js";import"./select-CxSQralT.js";import"./index-ohYBQjSJ.js";import"./globe-BvyP_gKp.js";import"./uk-Drv84rxe.js";import"./star-B840Te7u.js";import"./eye-jg7wg44x.js";import"./avatar-CGybcn-y.js";import"./user-Dt39FPRe.js";import"./search-B1u6Ento.js";import"./plus-D5zmitre.js";import"./useMutation-BJki3aSv.js";import"./map-pin-0eGOnbmD.js";function B(){const o=m(),{user:e}=c();if(!e)return o("/auth"),null;const{data:t,isLoading:d}=g({queryKey:["user-favorites",e.id],queryFn:async()=>{const{data:i,error:r}=await n.from("favorites").select(`
          *,
          listings (
            id,
            title,
            price,
            currency,
            location,
            images,
            is_promoted,
            created_at,
            status
          )
        `).eq("user_id",e.id);if(r)throw r;return i==null?void 0:i.filter(l=>{var a;return((a=l.listings)==null?void 0:a.status)==="active"})}});return s.jsxs("div",{className:"min-h-screen bg-background",children:[s.jsx(u,{}),s.jsxs("div",{className:"container mx-auto px-4 py-8",children:[s.jsx("h1",{className:"text-2xl font-bold mb-6",children:"Обрані оголошення"}),d?s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",children:[...Array(8)].map((i,r)=>s.jsxs("div",{className:"bg-card rounded-lg p-4 animate-pulse",children:[s.jsx("div",{className:"aspect-square bg-muted rounded-lg mb-3"}),s.jsx("div",{className:"h-4 bg-muted rounded mb-2"}),s.jsx("div",{className:"h-3 bg-muted rounded w-2/3"})]},r))}):t&&t.length>0?s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",children:t.map(i=>{var r;return i.listings&&s.jsx(x,{id:i.listings.id,title:i.listings.title,price:i.listings.price||0,currency:i.listings.currency,location:i.listings.location,image:((r=i.listings.images)==null?void 0:r[0])||"/placeholder.svg",isPromoted:i.listings.is_promoted,createdAt:i.listings.created_at},i.listings.id)})}):s.jsxs("div",{className:"text-center py-12 bg-card rounded-lg",children:[s.jsx(h,{className:"w-16 h-16 text-muted-foreground mx-auto mb-4"}),s.jsx("p",{className:"text-muted-foreground mb-4",children:"У вас ще немає обраних оголошень"}),s.jsx("button",{onClick:()=>o("/search"),className:"text-primary hover:underline",children:"Переглянути всі оголошення"})]})]}),s.jsx(p,{})]})}export{B as default};

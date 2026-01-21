	
<script lang="ts">
  import { Accordion, type WithoutChildrenOrChild } from "bits-ui";
  import AccordionItem from "$lib/components/ui/AccordionItem.svelte";
 
  type Item = {
    value?: string;
    title: string;
    content: string;
    disabled?: boolean;
  };
 
  let {
    value = $bindable(),
    ref = $bindable(null),
    items,
    ...restProps
  }: WithoutChildrenOrChild<Accordion.RootProps> & {
    items: Item[];
  } = $props();
</script>
 
<!--
 Since we have to destructure the `value` to make it `$bindable`, we need to use `as any` here to avoid
 type errors from the discriminated union of `"single" | "multiple"`.
 (an unfortunate consequence of having to destructure bindable values)
  -->
<Accordion.Root bind:value bind:ref {...restProps as any} class={'text-gray-700 dark:text-gray-300 w-full sm:max-w-[70%]'}>
  <div class="flex flex-col space-y-2 overflow-hidden rounded-lg">
    {#each items as item, i (item.title + i)}
      <span><AccordionItem {...item} /></span>
    {/each}
  </div>
</Accordion.Root>

<!--
"flex min-h-14 items-center justify-between bg-gray-100 px-6 py-2.5 text-gray-700 hover:bg-gray-200 hover:underline dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
-->
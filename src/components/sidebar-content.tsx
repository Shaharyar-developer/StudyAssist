import { Button } from "@heroui/react";
import { SidebarContent, SidebarFooter, SidebarHeader } from "./app-sidebar";
import { IconPlus } from "@tabler/icons-react";
import { withInitPaperForm } from "./init-paper-form";

export const SidebarOptions = () => {
  const { Component: Form, open: openForm } = withInitPaperForm();
  return (
    <>
      <SidebarHeader></SidebarHeader>
      <SidebarContent></SidebarContent>
      <SidebarFooter>
        <Button
          fullWidth
          size="lg"
          variant="flat"
          color="primary"
          endContent={<IconPlus />}
          onPress={openForm}
        >
          Add Paper
        </Button>
      </SidebarFooter>
      {Form}
    </>
  );
};

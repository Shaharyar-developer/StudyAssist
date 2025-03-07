import { Button } from "@heroui/react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
} from "@heroui/dropdown";
import { IconMenu, IconSettings2, IconUser } from "@tabler/icons-react";

export const PreferencesMenu = (props: {
    open: () => void;
    Modal: JSX.Element;
}) => {
    return (
        <>
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        isIconOnly
                        variant="light"
                        size="lg"
                        className="text-default-600"
                    >
                        <IconMenu />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu variant="faded">
                    <DropdownItem
                        showDivider
                        startContent={<IconSettings2 />}
                        key={"settings"}
                        onPress={props.open}
                    >
                        Settings
                    </DropdownItem>
                    <DropdownItem startContent={<IconUser />} key={"profile"}>
                        Profile
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
            {props.Modal}
        </>
    );
};

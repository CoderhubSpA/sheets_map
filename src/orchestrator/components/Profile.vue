<template>
    <div class="profile">
        <span class="profile__close" @click="$emit('close')" title="Cerrar">
            <b-icon icon="x-circle-fill" font-scale="1.4"></b-icon>
        </span>
        <div class="profile__circle-container">
            <div class="profile__avatar">
                <div v-if="!picture" class="avatar-circle">
                    <b-icon icon="person-fill" font-scale="4"></b-icon>
                </div>
                <div v-else class="avatar-circle">
                    <img :src="picture" alt="Profile Picture" class="avatar-picture" />
                </div>
                <button class="avatar-edit-btn" title="Cambiar foto" @click="addPicture">
                    <b-icon icon="pencil-fill" font-scale="0.8"></b-icon>
                </button>
            </div>
        </div>
        <div class="profile__name">{{ userName }}</div>
        <div class="profile__actions">
            <button class="profile__action-btn" @click="$emit('change-password')">
                <b-icon icon="lock-fill" font-scale="1.1"></b-icon>
                <span>Cambiar contraseña</span>
                <b-icon icon="chevron-right" font-scale="0.9"></b-icon>
            </button>
            <button class="profile__action-btn profile__action-btn--disconnect" @click="$emit('disconnect')">
                <b-icon icon="box-arrow-right" font-scale="1.1"></b-icon>
                <span>Desconectar</span>
                <b-icon icon="chevron-right" font-scale="0.9"></b-icon>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Profile',
    props: {
        userName: { type: String, default: '' },
    },
    data() {
        return {
            picture: null,
        };
    },
    methods: {
        addPicture() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    console.log('Nueva foto seleccionada:', file);
                    this.picture = URL.createObjectURL(file);
                }
            };
            fileInput.click();
        },
    },
}
</script>

<style lang="scss" scoped>
.profile {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding-top: 10px;

    &__close {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        top: -10px;
        right: -10px;
        width: 32px;
        height: 32px;
        color: #bebebe;
        border-radius: 50%;
        border: none;
        transition: color 0.15s;
        cursor: pointer;

        &:hover {
            color: #b0b0b0;
        }
    }

    &__circle-container {
        padding: 20px;
        border: solid 1px #bebebe;
        border-radius: 50%;
    }

    &__avatar {
        position: relative;
        width: 100px;
        height: 100px;

        .avatar-circle {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background-color: #c8c8c8;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            overflow: hidden;
        }

        .avatar-picture {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .avatar-edit-btn {
            position: absolute;
            bottom: 2px;
            right: 2px;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 30px;
            height: 30px;
            color: #fff;
            background-color: var(--primary-color);
            border: solid 1px #fff;
            border-radius: 50%;
            font-size: 0.75rem;
            cursor: pointer;

            &:hover {
                filter: brightness(0.9);
            }
        }
    }

    &__name {
        font-size: 1.2rem;
        font-weight: 700;
        color: #000;
    }

    &__actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    &__action-btn {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        padding: 14px 20px;
        border-radius: 12px;
        border: none;
        background-color: var(--primary-color);
        color: #fff;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: filter 0.15s;

        span {
            flex: 1;
            text-align: left;
        }

        &:hover {
            filter: brightness(0.92);
        }
    }
}
</style>
